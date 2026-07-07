/**
 * startup-migration.ts
 * Ejecuta al arrancar el servidor para asegurar que la BD tiene
 * todas las columnas que el código necesita.
 * Usa pool.query() directamente (más fiable que db.execute con neon-serverless).
 */

import { pool } from "./db";

const MIGRATIONS = [
  // ── Core auth ──────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS replit_id text`,

  // ── Email verification ─────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token text`,

  // Usuarios existentes → considerados verificados para no bloquear acceso
  `UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL`,

  // ── Stripe ─────────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamp`,

  // ── Profile extendido ──────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_nif text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS city text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS province text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS public_slug text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS condiciones_servicio text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS plazo_entrega_dias integer DEFAULT 10`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bizum_phone text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS iban text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled_payment_methods jsonb`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tramo1_percent integer DEFAULT 25`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS block_form_until_payment1 boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS block_certificate_until_payment2 boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_reminder_days integer DEFAULT 3`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS commercial_name text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS firma_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_signature text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS invoice_series_prefix text DEFAULT 'FAC'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS invoice_next_number integer DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS iva_percent decimal(5,2) DEFAULT 21`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_form_completed boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_payment_received boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_new_message boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_digest_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_digest_hour integer DEFAULT 8`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Madrid'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_api_key text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_connected_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,

  // ── Two-factor authentication (Email OTP) ──────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_otp_hash text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_otp_expiry timestamptz`,

  // ── Client portal token ───────────────────────────────────────────
  `ALTER TABLE certifications ADD COLUMN IF NOT EXISTS client_portal_token text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS certifications_client_portal_token_idx ON certifications(client_portal_token) WHERE client_portal_token IS NOT NULL`,

  // ── Unique constraint en username ──────────────────────────────────────────
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique')
     THEN ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username); END IF;
   END $$`,

  // ── refresh_tokens ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id serial PRIMARY KEY,
    user_id text NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id)`,

  // ── certification_shares (Sprint 3.2 — colaboración entre técnicos) ─────────
  `CREATE TABLE IF NOT EXISTS certification_shares (
    id                   SERIAL PRIMARY KEY,
    certification_id     INTEGER NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    owner_user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborator_email   TEXT NOT NULL,
    collaborator_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status               TEXT NOT NULL DEFAULT 'pending',
    permission           TEXT NOT NULL DEFAULT 'read',
    invited_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at          TIMESTAMP,
    revoked_at           TIMESTAMP,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS cert_shares_cert_id_idx      ON certification_shares(certification_id)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_owner_idx        ON certification_shares(owner_user_id)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_collab_email_idx ON certification_shares(collaborator_email)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_collab_user_idx  ON certification_shares(collaborator_user_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cert_shares_unique_active_idx
    ON certification_shares(certification_id, collaborator_email)
    WHERE status != 'revoked'`,
];

export async function runStartupMigrations(): Promise<void> {
  const client = await pool.connect();
  let ok = 0, fail = 0;
  try {
    for (const m of MIGRATIONS) {
      try {
        await client.query(m);
        ok++;
      } catch (e: any) {
        const msg = String(e?.message || e?.detail || e?.code || e || "unknown");
        const isExpected =
          msg.includes("already exists") ||
          msg.includes("duplicate") ||
          msg.includes("42701") || // duplicate_column
          msg.includes("42P07");   // duplicate_table
        if (isExpected) {
          ok++;
        } else {
          console.warn(`[migration] WARN: ${msg.slice(0, 200)}`);
          fail++;
        }
      }
    }
  } finally {
    client.release();
  }
  console.log(`[migration] Startup migration: ${ok} ok, ${fail} warnings`);
}
