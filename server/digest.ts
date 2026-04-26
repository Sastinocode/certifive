/**
 * CERTIFIVE — Daily digest cron
 *
 * Fires once per day at 08:00 Europe/Madrid time.
 * For each active certifier that has something pending, it sends
 * a personalised summary email via SendGrid.
 *
 * Items included in the digest:
 *  ① Active certifications (status "En Proceso")
 *  ② Manual payments waiting for confirmation
 *  ③ Solicitud forms sent > 24 h ago but not yet completed
 *  ④ CEE forms sent > 48 h ago but not yet completed
 *
 * If a certifier has nothing to report, no email is sent.
 *
 * Timezone logic: we check every 60 s whether the current minute
 * in "Europe/Madrid" is HH:MM == 08:00.  We also track the last
 * send date so we fire at most once per calendar day.
 *
 * No external cron library required — pure setInterval.
 */

import { db } from "./db";
import { users, certifications, payments } from "../shared/schema";
import { eq, and, isNotNull, lt } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DigestData {
  activeCerts:        number;
  pendingPayments:    number;
  pendingSolicitudes: number;   // sent > 24 h, not completed
  pendingCeeForms:    number;   // sent > 48 h, not completed
}

// ── Madrid-time helper ────────────────────────────────────────────────────────

function madridHHMM(): { hh: number; mm: number; dateStr: string } {
  const now     = new Date();
  const madrid  = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour:     "2-digit",
    minute:   "2-digit",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
    hour12:   false,
  }).formatToParts(now);

  const part = (t: string) => madrid.find(p => p.type === t)?.value ?? "00";

  return {
    hh:      parseInt(part("hour"),   10),
    mm:      parseInt(part("minute"), 10),
    dateStr: `${part("year")}-${part("month")}-${part("day")}`,
  };
}

// ── Email template ────────────────────────────────────────────────────────────

const APP_URL    = (process.env.APP_URL ?? "https://certifive.es").replace(/\/$/, "");
const FROM_EMAIL = "no-reply@certifive.es";
const FROM_NAME  = "CERTIFIVE";

function buildDigestHtml(name: string, d: DigestData): string {
  const greeting = name ? `Hola <strong>${name}</strong>,` : "Hola,";

  const rows: Array<{ icon: string; label: string; value: number; color: string }> = [
    {
      icon:  "🔵",
      label: "Certificaciones activas",
      value: d.activeCerts,
      color: "#1d4ed8",
    },
    {
      icon:  "💳",
      label: "Pagos pendientes de confirmar",
      value: d.pendingPayments,
      color: "#d97706",
    },
    {
      icon:  "📋",
      label: "Solicitudes sin respuesta (> 24 h)",
      value: d.pendingSolicitudes,
      color: "#7c3aed",
    },
    {
      icon:  "📁",
      label: "Formularios CEE sin enviar (> 48 h)",
      value: d.pendingCeeForms,
      color: "#0f766e",
    },
  ];

  const rowsHtml = rows
    .map(
      r => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0fdf4">
          <span style="font-size:16px">${r.icon}</span>&nbsp;
          <span style="font-size:14px;color:#374151">${r.label}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0fdf4;text-align:right">
          <strong style="font-size:16px;color:${r.color}">${r.value}</strong>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Resumen diario — CERTIFIVE</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

        <!-- HEADER -->
        <tr><td style="background:#064e3b;border-radius:16px 16px 0 0;padding:28px 36px">
          <span style="display:inline-block;background:rgba(255,255,255,.12);border-radius:8px;padding:7px 12px;font-size:13px;font-weight:bold;color:#fff;letter-spacing:.5px">🌿 CERTIFIVE</span>
          <p style="margin:12px 0 0;font-size:11px;font-weight:700;color:rgba(255,255,255,.5);letter-spacing:1px;text-transform:uppercase">Resumen diario</p>
        </td></tr>

        <!-- BODY -->
        <tr><td style="background:#fff;padding:36px 36px 28px">
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#064e3b">Buenos días 👋</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">${greeting} aquí tienes tu resumen de actividad para hoy.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rowsHtml}
          </table>

          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0">
            <tr><td style="background:#065f46;border-radius:10px">
              <a href="${APP_URL}" target="_blank"
                 style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">
                Ir al panel →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- FOOTER -->
        <tr><td style="background:#f0fdf4;border-radius:0 0 16px 16px;padding:20px 36px;border-top:1px solid #d1fae5">
          <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
            Recibes este email porque tienes actividad pendiente en CERTIFIVE.
            <a href="${APP_URL}" style="color:#059669;text-decoration:none">certifive.es</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Per-user digest data ───────────────────────────────────────────────────────

async function getUserDigest(userId: number): Promise<DigestData> {
  const now        = new Date();
  const ago24h     = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const ago48h     = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [activeCerts, pendingPaymentRows, pendingSolicitudesRows, pendingCeeRows] =
    await Promise.all([
      // ① Active certs (status "En Proceso", not archived)
      db
        .select({ id: certifications.id })
        .from(certifications)
        .where(
          and(
            eq(certifications.userId, userId),
            eq(certifications.status, "En Proceso"),
            eq(certifications.isArchived, false)
          )
        ),

      // ② Manual payments awaiting confirmation
      db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.userId, userId),
            eq(payments.estadoConfirmacion, "pendiente_confirmacion")
          )
        ),

      // ③ Solicitudes sent > 24 h ago, not yet completed
      db
        .select({ id: certifications.id })
        .from(certifications)
        .where(
          and(
            eq(certifications.userId, userId),
            eq(certifications.solicitudStatus, "enviado"),
            isNotNull(certifications.solicitudSentAt),
            lt(certifications.solicitudSentAt, ago24h)
          )
        ),

      // ④ CEE forms sent > 48 h ago, not yet completed
      db
        .select({ id: certifications.id })
        .from(certifications)
        .where(
          and(
            eq(certifications.userId, userId),
            eq(certifications.ceeFormStatus, "enviado"),
            isNotNull(certifications.ceeFormSentAt),
            lt(certifications.ceeFormSentAt, ago48h)
          )
        ),
    ]);

  return {
    activeCerts:        activeCerts.length,
    pendingPayments:    pendingPaymentRows.length,
    pendingSolicitudes: pendingSolicitudesRows.length,
    pendingCeeForms:    pendingCeeRows.length,
  };
}

function hasAnythingToReport(d: DigestData): boolean {
  return (
    d.activeCerts > 0 ||
    d.pendingPayments > 0 ||
    d.pendingSolicitudes > 0 ||
    d.pendingCeeForms > 0
  );
}

// ── Main send function ────────────────────────────────────────────────────────

async function sendDailyDigests(): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[digest] ⚠️  SENDGRID_API_KEY not set — skipping digest");
    return;
  }
  sgMail.setApiKey(apiKey);

  console.log("[digest] 🕗 Running daily digest…");

  // Fetch all users that have an email address
  const certifiers = await db
    .select({ id: users.id, email: users.email, name: users.name, username: users.username })
    .from(users)
    .where(isNotNull(users.email));

  let sent = 0;
  let skipped = 0;

  for (const certifier of certifiers) {
    if (!certifier.email) continue;

    const digestData = await getUserDigest(certifier.id);

    if (!hasAnythingToReport(digestData)) {
      skipped++;
      continue;
    }

    const displayName = certifier.name || certifier.username || "";

    try {
      await sgMail.send({
        to:      certifier.email,
        from:    { email: FROM_EMAIL, name: FROM_NAME },
        subject: `📊 Tu resumen diario — ${new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })}`,
        html:    buildDigestHtml(displayName, digestData),
      });
      sent++;
      console.log(`[digest]  ✉  ${certifier.email}`);
    } catch (err: any) {
      const detail = err?.response?.body?.errors ?? err?.message ?? err;
      console.error(`[digest]  ✗  ${certifier.email}`, detail);
    }
  }

  console.log(`[digest] ✅ Done — ${sent} sent, ${skipped} skipped (nothing to report)`);
}

// ── Cron ──────────────────────────────────────────────────────────────────────

export function startDigestCron(): void {
  let lastSentDate = "";

  const tick = () => {
    const { hh, mm, dateStr } = madridHHMM();

    // Fire at 08:00 Madrid time, at most once per calendar day
    if (hh === 8 && mm === 0 && dateStr !== lastSentDate) {
      lastSentDate = dateStr;
      sendDailyDigests().catch(err =>
        console.error("[digest] Unexpected error:", err)
      );
    }
  };

  // Check every 60 seconds
  setInterval(tick, 60_000);

  console.log("[digest] ⏰ Daily digest cron started (fires at 08:00 Europe/Madrid)");
}
