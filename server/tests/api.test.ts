/**
 * Tests mínimos de la API de Certifive.
 *
 * Runner : vitest (npm test)
 * Mocks  : DB, email, crons — definidos en setup.ts
 *
 * Cubre:
 *   1. GET  /api/health                          — sanity check
 *   2. POST /api/auth/login                      — 400 / 401 / 200+token
 *   3. POST /api/certifications                  — 401 sin auth / 201 con auth
 *   4. GET  /api/certifications/:id/export-data  — 401 / 404 / 200
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createTestApp } from "./appFactory";

// db mock — importado para inyectar datos por test
import { db } from "../db";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeJwt(userId = 1) {
  return jwt.sign(
    { id: userId, username: "testuser", role: "user" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
}

const MOCK_USER = {
  id: 1,
  username: "testuser",
  email: "test@certifive.es",
  password: bcrypt.hashSync("password123", 10),
  role: "user",
  name: "Test User",
  firstName: "Test",
  lastName: "User",
  emailVerifiedAt: new Date(),
  isActive: true,
  subscriptionStatus: "active",
  subscriptionCurrentPeriodEnd: null,
  onboardingCompleted: true,
};

const MOCK_CERT = {
  id: 42,
  userId: 1,
  ownerName: "María López",
  address: "Calle Mayor 10",
  city: "Madrid",
  propertyType: "Vivienda",
  workflowStatus: "borrador",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_CERTIFIER = {
  name: "Técnico Test",
  firstName: "Técnico",
  company: "CertiTest S.L.",
  licenseNumber: "E12345",
  email: "tec@certifive.es",
  phone: "600123456",
  province: "Madrid",
};

// ── Suite 1 — Health check ────────────────────────────────────────────────────
describe("GET /api/health", () => {
  it("devuelve 200 y { status: 'ok' }", async () => {
    const res = await request(createTestApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ── Suite 2 — Login ───────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 si faltan usuario y contraseña", async () => {
    const res = await request(createTestApp())
      .post("/api/auth/login")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("401 si el usuario no existe en la DB", async () => {
    // db.limit devuelve [] por defecto (setup.ts)
    const res = await request(createTestApp())
      .post("/api/auth/login")
      .send({ username: "fantasma", password: "cualquiera" });
    expect(res.status).toBe(401);
  });

  it("401 si la contraseña es incorrecta", async () => {
    vi.mocked(db.limit as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([MOCK_USER]);

    const res = await request(createTestApp())
      .post("/api/auth/login")
      .send({ username: "testuser", password: "mal" });
    expect(res.status).toBe(401);
  });

  it("200 + token JWT cuando las credenciales son correctas", async () => {
    // select (usuario) → returning (refresh token)
    vi.mocked(db.limit as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([MOCK_USER]);
    vi.mocked(db.returning as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([{ id: 99, token: "rt", expiresAt: new Date() }]);

    const res = await request(createTestApp())
      .post("/api/auth/login")
      .send({ username: "testuser", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("refreshToken");
    expect(res.body.user.username).toBe("testuser");
  });
});

// ── Suite 3 — Crear certificación ─────────────────────────────────────────────
describe("POST /api/certifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 sin Authorization header", async () => {
    const res = await request(createTestApp())
      .post("/api/certifications")
      .send({ ownerName: "Test" });
    expect(res.status).toBe(401);
  });

  it("401 con token malformado", async () => {
    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", "Bearer no-es-un-jwt")
      .send({ ownerName: "Test" });
    expect(res.status).toBe(401);
  });

  it("201 con token válido — devuelve la cert creada", async () => {
    vi.mocked(db.returning as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([MOCK_CERT]);

    const res = await request(createTestApp())
      .post("/api/certifications")
      .set("Authorization", `Bearer ${makeJwt()}`)
      .send({ ownerName: "María López", address: "Calle Mayor 10", city: "Madrid" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
  });
});

// ── Suite 4 — Export CE3X ─────────────────────────────────────────────────────
describe("GET /api/certifications/:id/export-data", () => {
  beforeEach(() => vi.clearAllMocks());

  it("401 sin autenticación", async () => {
    const res = await request(createTestApp())
      .get("/api/certifications/42/export-data");
    expect(res.status).toBe(401);
  });

  it("404 si la cert no pertenece al usuario autenticado", async () => {
    // DB devuelve [] → cert no encontrada
    const res = await request(createTestApp())
      .get("/api/certifications/999/export-data")
      .set("Authorization", `Bearer ${makeJwt()}`);
    expect(res.status).toBe(404);
  });

  it("no devuelve 401/404 cuando la cert existe y pertenece al usuario", async () => {
    let call = 0;
    // 1ª llamada a limit → cert, 2ª → certifier; el rest → []
    vi.mocked(db.limit as ReturnType<typeof vi.fn>)
      .mockImplementation(() => {
        call++;
        if (call === 1) return Promise.resolve([MOCK_CERT]);
        if (call === 2) return Promise.resolve([MOCK_CERTIFIER]);
        return Promise.resolve([]);
      });

    const res = await request(createTestApp())
      .get("/api/certifications/42/export-data")
      .set("Authorization", `Bearer ${makeJwt()}`);

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(404);
  });
});
