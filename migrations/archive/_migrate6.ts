/**
 * _migrate6.ts — Sprint 3.2: tabla certification_shares
 *
 * Crea la tabla de colaboración entre técnicos.
 * Seguro de re-ejecutar: usa CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
 *
 * Ejecutar en local:
 *   npx tsx _migrate6.ts
 *
 * En Railway (Production):
 *   Ve a Railway → tu servicio → Shell y ejecuta el mismo comando.
 */

import { pool } from "./server/db";

const steps = [
  // ── Tabla principal ──────────────────────────────────────────────────────
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

  // ── Índices ──────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS cert_shares_cert_id_idx       ON certification_shares(certification_id)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_owner_idx         ON certification_shares(owner_user_id)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_collab_email_idx  ON certification_shares(collaborator_email)`,
  `CREATE INDEX IF NOT EXISTS cert_shares_collab_user_idx   ON certification_shares(collaborator_user_id)`,

  // ── Unicidad: un técnico solo puede ser invitado una vez por expediente ──
  `CREATE UNIQUE INDEX IF NOT EXISTS cert_shares_unique_active_idx
    ON certification_shares(certification_id, collaborator_email)
    WHERE status != 'revoked'`,
];

async function run() {
  const client = await pool.connect();
  try {
    for (const sql of steps) {
      const label = sql.trim().split("\n")[0].slice(0, 80);
      process.stdout.write(`  ▸ ${label}… `);
      await client.query(sql);
      console.log("✓");
    }
    console.log("\n✅ _migrate6 completada.");
  } catch (err) {
    console.error("\n❌ Error en migración:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
