/**
 * _migrate5.ts — Migración del sistema de autenticación propio
 *
 * Añade a la tabla "users" todas las columnas del nuevo auth y crea refresh_tokens.
 * Seguro de re-ejecutar: usa ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS.
 *
 * Ejecutar:
 *   npx tsx _migrate5.ts
 */

import { db } from "./server/db";
import { sql } from "drizzle-orm";

const migrations = [
  // ── Core auth ──────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS replit_id text`,

  // ── Email verification ─────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token text`,

  // Marcar todos los usuarios existentes como verificados (para no bloquearlos)
  `UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL`,

  // ── Stripe ─────────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_price_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamp`,

  // ── Extended profile ───────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS license_number text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS dni_nif text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS city text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS province text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS public_slug text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS condiciones_servicio text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS plazo_entrega_dias integer DEFAULT 10`,

  // ── Payment settings ───────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bizum_phone text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS iban text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS enabled_payment_methods jsonb`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tramo1_percent integer DEFAULT 25`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS block_form_until_payment1 boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS block_certificate_until_payment2 boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_reminder_days integer DEFAULT 3`,

  // ── Profile media ──────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS commercial_name text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS firma_url text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_signature text`,

  // ── Invoice settings ───────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS invoice_series_prefix text DEFAULT 'FAC'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS invoice_next_number integer DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS iva_percent decimal(5,2) DEFAULT 21`,

  // ── Notifications ──────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_form_completed boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_payment_received boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_new_message boolean NOT NULL DEFAULT true`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_digest_enabled boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_digest_hour integer DEFAULT 8`,

  // ── Onboarding ─────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Madrid'`,

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_api_key text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_connected_at timestamp`,

  // ── updated_at (si no existe) ──────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,

  // ── Unique constraint en username ──────────────────────────────────────────
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'users_username_unique'
     ) THEN
       ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
     END IF;
   END $$`,

  // ── Unique constraint en email (si no existe ya) ───────────────────────────
  `DO $$ BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
     ) THEN
       ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
     END IF;
   END $$`,

  // ── refresh_tokens — sin FK para compatibilidad con id varchar o integer ──
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id serial PRIMARY KEY,
    user_id text NOT NULL,
    token text NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(user_id)`,

  // ── session table (connect-pg-simple) ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS session (
    sid varchar NOT NULL COLLATE "default",
    sess json NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
  )`,
  `CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)`,
];

let ok = 0, fail = 0;
for (const m of migrations) {
  const label = m.slice(0, 60).replace(/\s+/g, " ").trim();
  try {
    await db.execute(sql.raw(m));
    ok++;
    process.stdout.write(".");
  } catch (e: any) {
    const msg = (e.message || "").split("\n")[0];
    if (msg.includes("already exists") || msg.includes("duplicate")) {
      ok++;
      process.stdout.write(".");
    } else {
      console.error(`\nFAIL [${label}]: ${msg}`);
      fail++;
    }
  }
}
console.log(`\n\nDone: ${ok} ok, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
