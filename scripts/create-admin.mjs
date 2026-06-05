/**
 * CERTIFIVE — Crear usuario admin en producción
 *
 * Uso local (con .env):
 *   node --env-file=.env scripts/create-admin.mjs
 *
 * En Railway (una sola vez):
 *   Settings → Deploy → Start Command:
 *   node scripts/create-admin.mjs
 *   (con ADMIN_EMAIL y ADMIN_PASSWORD como variables de entorno temporales)
 */

import { neon } from "@neondatabase/serverless";
import bcrypt   from "bcryptjs";

const DB_URL   = process.env.DATABASE_URL;
const email    = process.env.ADMIN_EMAIL    ?? "admin@certifive.es";
const password = process.env.ADMIN_PASSWORD;
const username = process.env.ADMIN_USERNAME ?? "admin";

if (!DB_URL)   { console.error("❌  Falta DATABASE_URL");   process.exit(1); }
if (!password) { console.error("❌  Falta ADMIN_PASSWORD"); process.exit(1); }

const sql = neon(DB_URL);

// ¿Ya existe?
const existing = await sql`
  SELECT id, role FROM users
  WHERE username = ${username} OR email = ${email}
  LIMIT 1
`;

if (existing.length > 0) {
  const u = existing[0];
  if (u.role === "admin") {
    console.log(`✅  El usuario ya existe y ya es admin (id=${u.id}). Nada que hacer.`);
    process.exit(0);
  }
  // Existe pero no es admin → promover
  await sql`UPDATE users SET role = 'admin' WHERE id = ${u.id}`;
  console.log(`✅  Usuario existente (id=${u.id}) promovido a admin.`);
  process.exit(0);
}

// Crear nuevo
const hash   = await bcrypt.hash(password, 12);
const [row]  = await sql`
  INSERT INTO users (username, email, password, role, subscription_plan, created_at, updated_at)
  VALUES (${username}, ${email}, ${hash}, 'admin', 'empresa', NOW(), NOW())
  RETURNING id
`;

console.log(`✅  Usuario admin creado correctamente.`);
console.log(`   id:       ${row.id}`);
console.log(`   username: ${username}`);
console.log(`   email:    ${email}`);
console.log(`   plan:     empresa`);
