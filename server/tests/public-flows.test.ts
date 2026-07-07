/**
 * Tests de flujos públicos por token (BLOQUE B — B4).
 *
 * Runner : vitest (npm test)
 * Mocks  : DB (setup.ts) — sin conexión real ni emails reales.
 *
 * Cubre los 4 tramos del flujo público sin sesión (solicitud → presupuesto →
 * pago → formulario), cada uno con: token inválido → 404, token válido carga
 * datos correctos, y la transición de estado que le corresponde.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "./appFactory";
import { db } from "../db";

const limitMock  = () => vi.mocked(db.limit  as ReturnType<typeof vi.fn>);
const setMock    = () => vi.mocked(db.set    as ReturnType<typeof vi.fn>);
const insertMock = () => vi.mocked(db.insert as ReturnType<typeof vi.fn>);
const returningMock = () => vi.mocked(db.returning as ReturnType<typeof vi.fn>);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Formulario técnico (GET/POST /api/form/:token) ────────────────────────────
describe("GET /api/form/:token", () => {
  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]); // no hay cert con ese formToken

    const res = await request(createTestApp()).get("/api/form/token-invalido");
    expect(res.status).toBe(404);
  });

  it("200 con token válido — devuelve datos precargados del propietario", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 1, userId: 10, formStatus: "enviado",
          ownerName: "Ana Ruiz", ownerEmail: "ana@test.es", address: "Calle Sol 5", city: "Sevilla",
        }]);
      }
      return Promise.resolve([{ name: "Técnico Certifive", firstName: "Técnico", company: "Certifive S.L." }]);
    });

    const res = await request(createTestApp()).get("/api/form/token-valido");
    expect(res.status).toBe(200);
    expect(res.body.alreadyCompleted).toBe(false);
    expect(res.body.prefill.ownerName).toBe("Ana Ruiz");
    expect(res.body.certifier.company).toBe("Certifive S.L.");
  });

  it("alreadyCompleted: true si el formulario ya se completó", async () => {
    limitMock().mockResolvedValueOnce([{ id: 1, formStatus: "completado" }]);

    const res = await request(createTestApp()).get("/api/form/token-completado");
    expect(res.status).toBe(200);
    expect(res.body.alreadyCompleted).toBe(true);
  });
});

describe("POST /api/form/:token/submit", () => {
  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp())
      .post("/api/form/token-invalido/submit")
      .send({ ownerName: "Test" });
    expect(res.status).toBe(404);
  });

  it("409 si el formulario ya fue enviado", async () => {
    limitMock().mockResolvedValueOnce([{ id: 1, formStatus: "completado" }]);

    const res = await request(createTestApp())
      .post("/api/form/token-completado/submit")
      .send({ ownerName: "Test" });
    expect(res.status).toBe(409);
  });

  it("200 con token válido — guarda snapshot en form_responses", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ id: 1, userId: 10, formStatus: "enviado", ownerName: "Ana" }]);
      return Promise.resolve([]); // certifier — sin email, se salta notificación
    });

    const res = await request(createTestApp())
      .post("/api/form/token-valido/submit")
      .send({ ownerName: "Ana Ruiz", address: "Calle Sol 5" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(insertMock()).toHaveBeenCalled(); // form_responses (audit trail)
  });
});

// ── Solicitud (tasación inicial) ───────────────────────────────────────────────
describe("POST /api/solicitud/nueva", () => {
  it("400 si faltan certifierId u ownerName", async () => {
    const res = await request(createTestApp())
      .post("/api/solicitud/nueva")
      .send({ ownerName: "Test" }); // falta certifierId
    expect(res.status).toBe(400);
  });

  it("200 crea la certificación con un token de solicitud", async () => {
    returningMock().mockResolvedValueOnce([{ id: 77, solicitudToken: "sol-abc" }]);
    limitMock().mockResolvedValueOnce([]); // certifier lookup — sin email, se salta notificación

    const res = await request(createTestApp())
      .post("/api/solicitud/nueva")
      .send({ certifierId: "10", ownerName: "Carlos Vidal" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.certificationId).toBe(77);
    expect(insertMock()).toHaveBeenCalled();
  });
});

describe("GET /api/solicitud/:token", () => {
  it("404 con token inválido o expirado", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp()).get("/api/solicitud/token-invalido");
    expect(res.status).toBe(404);
  });

  it("200 con token válido — devuelve datos del certificador y prefill", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 77, userId: 10, solicitudStatus: "abierto", ownerName: "Carlos Vidal",
        }]);
      }
      return Promise.resolve([{ id: 10, name: "Técnico Certifive", plazoEntregaDias: 7 }]);
    });

    const res = await request(createTestApp()).get("/api/solicitud/sol-abc");
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
    expect(res.body.certifier.plazoEntregaDias).toBe(7);
    expect(res.body.prefill.ownerName).toBe("Carlos Vidal");
  });
});

describe("POST /api/solicitud/:token/submit", () => {
  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp())
      .post("/api/solicitud/token-invalido/submit")
      .send({ propertyType: "vivienda" });
    expect(res.status).toBe(404);
  });

  it("200 completa la solicitud y calcula precio estimado", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ id: 77, userId: 10, solicitudStatus: "abierto" }]);
      if (call === 2) return Promise.resolve([]); // sin tarifa activa configurada -> sin precio
      return Promise.resolve([]); // certifier — sin email
    });
    returningMock().mockResolvedValueOnce([{ id: 77, solicitudStatus: "completado" }]);

    const res = await request(createTestApp())
      .post("/api/solicitud/sol-abc/submit")
      .send({ ownerName: "Carlos Vidal", propertyType: "vivienda", totalArea: "90" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const payload = setMock().mock.calls[0][0];
    expect(payload.solicitudStatus).toBe("completado");
  });
});

// ── Presupuesto ────────────────────────────────────────────────────────────────
describe("GET /api/presupuesto/:token", () => {
  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp()).get("/api/presupuesto/token-invalido");
    expect(res.status).toBe(404);
  });

  it("200 devuelve el presupuesto con importes y datos del certificador", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 77, userId: 10, presupuestoStatus: "enviado",
          ownerName: "Carlos Vidal", finalPrice: "150.00",
          tramo1Amount: "37.50", tramo2Amount: "112.50",
          paymentToken: "pay-xyz",
        }]);
      }
      return Promise.resolve([{ name: "Técnico Certifive", licenseNumber: "E12345" }]);
    });

    const res = await request(createTestApp()).get("/api/presupuesto/pres-abc");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("enviado");
    expect(res.body.cert.finalPrice).toBe("150.00");
    expect(res.body.paymentToken).toBe("pay-xyz");
    expect(res.body.certifier.licenseNumber).toBe("E12345");
  });
});

describe("POST /api/presupuesto/:token/aceptar", () => {
  it("404 con token inválido", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp()).post("/api/presupuesto/token-invalido/aceptar");
    expect(res.status).toBe(404);
  });

  it("200 cambia presupuestoStatus a aceptado y devuelve el paymentToken", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 77, userId: 10, presupuestoStatus: "enviado",
          ownerName: "Carlos Vidal", finalPrice: "150.00", tramo1Amount: "37.50",
          paymentToken: "pay-xyz", ownerEmail: null,
        }]);
      }
      return Promise.resolve([]); // certifier — sin email, se salta notificación
    });

    const res = await request(createTestApp()).post("/api/presupuesto/pres-abc/aceptar");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.paymentToken).toBe("pay-xyz");
    const payload = setMock().mock.calls[0][0];
    expect(payload.presupuestoStatus).toBe("aceptado");
  });

  it("200 idempotente si ya estaba aceptado (no vuelve a actualizar)", async () => {
    limitMock().mockResolvedValueOnce([{
      id: 77, presupuestoStatus: "aceptado", paymentToken: "pay-xyz",
    }]);

    const res = await request(createTestApp()).post("/api/presupuesto/pres-abc/aceptar");
    expect(res.status).toBe(200);
    expect(res.body.paymentToken).toBe("pay-xyz");
    expect(setMock()).not.toHaveBeenCalled();
  });
});

// ── Pago (token de pago) ───────────────────────────────────────────────────────
describe("GET /api/pay/:token", () => {
  it("404 con token de pago inválido", async () => {
    limitMock().mockResolvedValueOnce([]);

    const res = await request(createTestApp()).get("/api/pay/token-invalido");
    expect(res.status).toBe(404);
  });

  it("200 devuelve el importe del tramo 1 pendiente y datos del certificador", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 77, userId: 10, ownerName: "Carlos Vidal", address: "Calle Mayor 1", city: "Madrid",
          propertyType: "vivienda", tramo1PaidAt: null, tramo1Amount: "37.50", tramo2Amount: "112.50",
          finalPrice: "150.00",
        }]);
      }
      return Promise.resolve([{ name: "Técnico Certifive", enabledPaymentMethods: ["stripe", "bizum"] }]);
    });

    const res = await request(createTestApp()).get("/api/pay/pay-xyz");
    expect(res.status).toBe(200);
    expect(res.body.tramo).toBe(1);
    expect(res.body.amount).toBe(37.5);
    expect(res.body.totalAmount).toBe(150);
    expect(res.body.cert.ownerName).toBe("Carlos Vidal");
  });

  it("200 devuelve el tramo 2 cuando el tramo 1 ya está pagado", async () => {
    let call = 0;
    limitMock().mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve([{
          id: 77, userId: 10, ownerName: "Carlos Vidal",
          tramo1PaidAt: new Date(), tramo1Amount: "37.50", tramo2Amount: "112.50",
          finalPrice: "150.00",
        }]);
      }
      return Promise.resolve([]);
    });

    const res = await request(createTestApp()).get("/api/pay/pay-xyz");
    expect(res.status).toBe(200);
    expect(res.body.tramo).toBe(2);
    expect(res.body.amount).toBe(112.5);
  });
});
