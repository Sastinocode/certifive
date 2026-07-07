/**
 * Tests de pagos y suscripción (BLOQUE B — B3).
 *
 * Runner : vitest (npm test)
 * Mocks  : DB (setup.ts), paquete "stripe" y server/config (Stripe keys) — sin llamadas reales.
 *
 * Cubre:
 *   1. POST /api/subscription/webhook  — firma inválida → 400
 *   2. POST /api/subscription/webhook  — customer.subscription.updated/deleted actualizan el user
 *   3. Rutas de valor (checkSubscription) — sin suscripción activa → 402 / trial expirado → 402 / con activa → 200
 *   4. POST /api/pay/:token/manual     — pago manual (validación, token inválido, notificación creada)
 *   5. POST /api/payments/:id/confirm  — confirmación de pago manual
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createTestApp } from "./appFactory";
import { db } from "../db";

// ── Mock: server/config — inyecta claves de Stripe falsas sin tocar el resto ──
vi.mock("../config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config")>();
  return {
    ...actual,
    config: {
      ...actual.config,
      STRIPE_SECRET_KEY: "sk_test_fake",
      STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: "whsec_fake",
    },
  };
});

// ── Mock: paquete "stripe" — nunca llama a la API real ────────────────────────
const constructEventMock = vi.hoisted(() => vi.fn());
vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent: constructEventMock },
    subscriptions: { retrieve: vi.fn(), update: vi.fn() },
    customers: { create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    billingPortal: { sessions: { create: vi.fn() } },
    invoices: { list: vi.fn() },
    paymentIntents: { create: vi.fn() },
  })),
}));

function makeJwt(userId = 1, role = "user") {
  return jwt.sign(
    { id: userId, username: "testuser", role },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
}

function makeAdminJwt(userId = 99) {
  return makeJwt(userId, "admin");
}

const limitMock = () => vi.mocked(db.limit as ReturnType<typeof vi.fn>);
const setMock   = () => vi.mocked(db.set   as ReturnType<typeof vi.fn>);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Suite 1 — Webhook: firma inválida ─────────────────────────────────────────
describe("POST /api/subscription/webhook", () => {
  it("400 si la firma del webhook es inválida", async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });

    const res = await request(createTestApp())
      .post("/api/subscription/webhook")
      .set("stripe-signature", "sig_fake")
      .send({ type: "customer.subscription.updated" });

    expect(res.status).toBe(400);
  });

  it("customer.subscription.updated actualiza subscriptionStatus del user", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          status: "active",
          items: { data: [{ price: { id: "price_x" } }] },
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          canceled_at: null,
        },
      },
    });
    limitMock().mockResolvedValueOnce([{ id: 1 }]); // user encontrado por stripeCustomerId

    const res = await request(createTestApp())
      .post("/api/subscription/webhook")
      .set("stripe-signature", "sig_fake")
      .send({});

    expect(res.status).toBe(200);
    expect(setMock()).toHaveBeenCalled();
    const payload = setMock().mock.calls[0][0];
    expect(payload.subscriptionStatus).toBe("active");
  });

  it("customer.subscription.deleted marca al user como canceled y quita el plan", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_123", customer: "cus_123" } },
    });
    limitMock().mockResolvedValueOnce([{ id: 1 }]);

    const res = await request(createTestApp())
      .post("/api/subscription/webhook")
      .set("stripe-signature", "sig_fake")
      .send({});

    expect(res.status).toBe(200);
    const payload = setMock().mock.calls[0][0];
    expect(payload.subscriptionStatus).toBe("canceled");
    expect(payload.subscriptionPlan).toBe("free");
  });

  it("invoice.payment_failed marca al user como past_due", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "invoice.payment_failed",
      data: { object: { id: "in_123", customer: "cus_123" } },
    });
    limitMock().mockResolvedValueOnce([{ id: 1 }]);

    const res = await request(createTestApp())
      .post("/api/subscription/webhook")
      .set("stripe-signature", "sig_fake")
      .send({});

    expect(res.status).toBe(200);
    const payload = setMock().mock.calls[0][0];
    expect(payload.subscriptionStatus).toBe("past_due");
  });

  it("evento sin customer asociado en la DB no falla (received: true)", async () => {
    constructEventMock.mockReturnValueOnce({
      type: "customer.subscription.updated",
      data: { object: { id: "sub_x", customer: "cus_desconocido" } },
    });
    limitMock().mockResolvedValueOnce([]); // no hay user con ese stripeCustomerId

    const res = await request(createTestApp())
      .post("/api/subscription/webhook")
      .set("stripe-signature", "sig_fake")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});

// ── Suite 2 — checkSubscription en rutas de valor ─────────────────────────────
// NODE_ENV=test hace bypass del guard por defecto (para no romper el resto de
// la suite) — aquí lo desactivamos temporalmente para probar el guard real.
describe("checkSubscription en rutas de valor (POST /api/certifications)", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("402 subscription_required sin suscripción activa ni trial", async () => {
    limitMock().mockResolvedValueOnce([
      { subscriptionStatus: "canceled", subscriptionCurrentPeriodEnd: null },
    ]);

    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", `Bearer ${makeJwt()}`)
      .send({ ownerName: "Test", address: "Calle 1", city: "Madrid" });

    expect(res.status).toBe(402);
    expect(res.body.error).toBe("subscription_required");
    expect(res.body.code).toBe("SUBSCRIPTION_REQUIRED");
  });

  it("402 TRIAL_EXPIRED con trial vencido", async () => {
    limitMock().mockResolvedValueOnce([
      { subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: new Date(Date.now() - 86400_000) },
    ]);

    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", `Bearer ${makeJwt()}`)
      .send({ ownerName: "Test", address: "Calle 1", city: "Madrid" });

    expect(res.status).toBe(402);
    expect(res.body.code).toBe("TRIAL_EXPIRED");
  });

  it("200 con suscripción activa", async () => {
    limitMock().mockResolvedValueOnce([
      { subscriptionStatus: "active", subscriptionCurrentPeriodEnd: null },
    ]);
    vi.mocked(db.returning as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 42, ownerName: "Test" }]);

    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", `Bearer ${makeJwt()}`)
      .send({ ownerName: "Test", address: "Calle 1", city: "Madrid" });

    expect(res.status).toBe(201);
  });

  it("200 con trial vigente (no expirado)", async () => {
    limitMock().mockResolvedValueOnce([
      { subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: new Date(Date.now() + 86400_000 * 10) },
    ]);
    vi.mocked(db.returning as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 43, ownerName: "Test" }]);

    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", `Bearer ${makeJwt()}`)
      .send({ ownerName: "Test", address: "Calle 1", city: "Madrid" });

    expect(res.status).toBe(201);
  });
});

// ── Suite 3 — Pago manual (público, por token) ────────────────────────────────
describe("POST /api/pay/:token/manual", () => {
  it("400 si falta el método de pago", async () => {
    const res = await request(createTestApp())
      .post("/api/pay/tok123/manual")
      .send({});
    expect(res.status).toBe(400);
  });

  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]); // no existe cert con ese paymentToken

    const res = await request(createTestApp())
      .post("/api/pay/tok-invalido/manual")
      .send({ metodo: "bizum" });
    expect(res.status).toBe(404);
  });

  it("200 registra el pago pendiente con token válido", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 55, userId: 1, ownerName: "Juan Pérez",
          tramo1PaidAt: null, tramo1Amount: "60.00", tramo2Amount: "60.00",
          finalPrice: "120.00",
        }]);
      }
      return Promise.resolve([]); // certifier — no encontrado, se salta el email
    });

    const res = await request(createTestApp())
      .post("/api/pay/tok-valido/manual")
      .send({ metodo: "bizum", notas: "Pagado por Bizum" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── Suite 4 — Confirmación de pago manual (autenticado) ──────────────────────
describe("POST /api/payments/:id/confirm", () => {
  it("404 si el pago no existe", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ subscriptionPlan: "profesional" }]); // requireFeature("reports")
      return Promise.resolve([]); // pago no encontrado
    });

    const res = await request(createTestApp())
      .post("/api/payments/999/confirm")
      .set("Authorization", `Bearer ${makeAdminJwt()}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it("200 confirma un pago manual existente", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ subscriptionPlan: "profesional" }]); // requireFeature("reports")
      if (call === 2) {
        return Promise.resolve([{
          id: 501, certificationId: null, userId: 99, amount: "60.00", tramo: 1, metodo: "bizum",
        }]);
      }
      return Promise.resolve([]);
    });

    const res = await request(createTestApp())
      .post("/api/payments/501/confirm")
      .set("Authorization", `Bearer ${makeAdminJwt()}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
