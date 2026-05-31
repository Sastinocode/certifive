import { db } from "./server/db";
import { sql } from "drizzle-orm";
const migrations = [
  // invoices - missing
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_email text`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate decimal(5,2) DEFAULT 21`,
  `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS quote_request_id integer`,
  // certifications - missing formToken cols
  `ALTER TABLE certifications ADD COLUMN IF NOT EXISTS form_token text UNIQUE`,
  `ALTER TABLE certifications ADD COLUMN IF NOT EXISTS form_status text`,
  `ALTER TABLE certifications ADD COLUMN IF NOT EXISTS form_sent_at timestamp`,
  // payments - check missing cols
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'eur'`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS description text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata jsonb`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS error_message text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_charge_id text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS metodo text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS tramo integer`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS estado_confirmacion text DEFAULT 'pendiente_confirmacion'`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS fecha_notificacion timestamp`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS fecha_confirmacion timestamp`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmado_por integer`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS notas text`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at timestamp`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at timestamp`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at timestamp`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id integer`,
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS quote_request_id integer`,
];
let ok = 0, fail = 0;
for (const m of migrations) {
  try {
    await db.execute(sql.raw(m));
    ok++;
    process.stdout.write(".");
  } catch(e: any) {
    const msg = e.message.split("\n")[0];
    if (msg.includes("already exists")) { ok++; process.stdout.write("."); }
    else { console.error("\nFAIL:", msg); fail++; }
  }
}
console.log(`\nDone: ${ok} ok, ${fail} failed`);
process.exit(0);
