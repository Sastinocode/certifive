/**
 * Setup global de Vitest — se ejecuta antes de cada archivo de tests.
 * Mockea la infraestructura externa (DB, email, crons) para que los tests
 * corran sin conexión a Neon ni a SendGrid.
 */
import { vi } from "vitest";

// ── Variables de entorno mínimas ──────────────────────────────────────────────
process.env.JWT_SECRET     = "test-secret-vitest-certifive";
process.env.DATABASE_URL   = "postgresql://mock:mock@localhost/mock";
process.env.NODE_ENV       = "test";
process.env.SESSION_SECRET = "test-session-secret";
process.env.SENDGRID_API_KEY = "";

// ── Mock: base de datos (drizzle + neon) ──────────────────────────────────────
vi.mock("../db", () => ({
  db: buildDbMock(),
}));

function buildDbMock() {
  const m: Record<string, ReturnType<typeof vi.fn>> = {};
  const chain = () => proxy;
  const proxy: Record<string, unknown> = {
    select:    vi.fn(chain),
    from:      vi.fn(chain),
    where:     vi.fn(chain),
    limit:     vi.fn(() => Promise.resolve([])),
    insert:    vi.fn(chain),
    values:    vi.fn(chain),
    returning: vi.fn(() => Promise.resolve([])),
    update:    vi.fn(chain),
    set:       vi.fn(chain),
    leftJoin:  vi.fn(chain),
    orderBy:   vi.fn(() => Promise.resolve([])),
    groupBy:   vi.fn(() => Promise.resolve([])),
    offset:    vi.fn(chain),
    delete:    vi.fn(chain),
  };
  return proxy;
}

// ── Mock: email ───────────────────────────────────────────────────────────────
vi.mock("../email", () => ({
  initEmail: vi.fn(),
  sendPagoConfirmadoEmail:      vi.fn(),
  sendPagoManualPendienteEmail: vi.fn(),
  sendCEEFormLinkEmail:         vi.fn(),
  sendWelcomeEmail:             vi.fn(),
  sendEmailVerification:        vi.fn(),
  sendSolicitudRecibidaEmail:   vi.fn(),
}));

// ── Mock: rate limiters — pass-through en tests ───────────────────────────────
vi.mock("express-rate-limit", () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
  rateLimit: () => (_req: any, _res: any, next: any) => next(),
}));

// ── Mock: crons y helpers ─────────────────────────────────────────────────────
vi.mock("../notifications",       () => ({ startReminderCron: vi.fn(), createNotification: vi.fn() }));
vi.mock("../digest",              () => ({ startDigestCron: vi.fn() }));
vi.mock("../expiry-cron",         () => ({ startExpiryCron: vi.fn() }));
vi.mock("../createNotification",  () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock("../startup-migration",   () => ({ runStartupMigrations: vi.fn().mockResolvedValue(undefined) }));
