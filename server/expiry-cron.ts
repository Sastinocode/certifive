/**
 * CERTIFIVE — Certificate expiry reminder cron
 *
 * Fires once per day at 09:00 Europe/Madrid time.
 * Sends reminders to property owners 30 days and 10 days before
 * their energy certificate expires (caducidadAt field).
 *
 * Only sends to certifications with:
 *  - status = "Finalizado"
 *  - caducidadAt IS NOT NULL
 *  - caducidadAt is exactly 30 or 10 days from now
 *
 * Timezone logic: we check every 60 s whether the current minute
 * in "Europe/Madrid" is HH:MM == 09:00.  We also track the last
 * send date so we fire at most once per calendar day.
 *
 * No external cron library required — pure setInterval.
 */

import { db } from "./db";
import { certifications, users } from "../shared/schema";
import { eq, and, isNotNull, gte, lte } from "drizzle-orm";
import { sendCertificadoExpiryEmail } from "./email";

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

// ── Main send function ────────────────────────────────────────────────────────

async function sendExpiryReminders(): Promise<void> {
  console.log("[expiry-cron] 🕘 Running certificate expiry reminders…");

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  // Date range helpers (same day tolerance)
  const sameDay = (d1: Date, d2: Date) => {
    return d1.toDateString() === d2.toDateString();
  };

  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const dayEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  // Fetch certifications expiring in 30 days or 10 days
  const expiringCerts = await db
    .select({
      id: certifications.id,
      userId: certifications.userId,
      ownerName: certifications.ownerName,
      ownerEmail: certifications.ownerEmail,
      address: certifications.address,
      city: certifications.city,
      caducidadAt: certifications.caducidadAt,
    })
    .from(certifications)
    .where(
      and(
        eq(certifications.status, "Finalizado"),
        isNotNull(certifications.caducidadAt),
        isNotNull(certifications.ownerEmail)
      )
    );

  let sent30d = 0;
  let sent10d = 0;

  for (const cert of expiringCerts) {
    if (!cert.caducidadAt || !cert.ownerEmail) continue;

    const expiryDate = new Date(cert.caducidadAt);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    // Send only if exactly 30 or 10 days remain
    if (daysUntilExpiry !== 30 && daysUntilExpiry !== 10) continue;
    if (daysUntilExpiry < 0) continue; // Already expired

    // Get certifier info
    const certifier = await db
      .select({ name: users.name, username: users.username, company: users.company })
      .from(users)
      .where(eq(users.id, cert.userId))
      .limit(1);

    const certifierName = certifier[0]?.company || certifier[0]?.name || certifier[0]?.username || "Tu certificador";
    const propertyAddress = cert.address && cert.city
      ? `${cert.address}, ${cert.city}`
      : cert.address || cert.city || null;

    try {
      await sendCertificadoExpiryEmail({
        to: cert.ownerEmail,
        ownerName: cert.ownerName || "Propietario",
        certifierName,
        propertyAddress,
        caducidadAt: expiryDate,
        diasRestantes: daysUntilExpiry,
      });

      if (daysUntilExpiry === 30) sent30d++;
      if (daysUntilExpiry === 10) sent10d++;

      console.log(`[expiry-cron]  ✉  ${cert.ownerEmail} (${daysUntilExpiry}d)`);
    } catch (err: any) {
      console.error(`[expiry-cron]  ✗  ${cert.ownerEmail}`, err?.message ?? err);
    }
  }

  console.log(`[expiry-cron] ✅ Done — ${sent30d} sent (30d), ${sent10d} sent (10d)`);
}

// ── Cron ──────────────────────────────────────────────────────────────────────

export function startExpiryCron(): void {
  let lastSentDate = "";

  const tick = () => {
    const { hh, mm, dateStr } = madridHHMM();

    // Fire at 09:00 Madrid time, at most once per calendar day
    if (hh === 9 && mm === 0 && dateStr !== lastSentDate) {
      lastSentDate = dateStr;
      sendExpiryReminders().catch(err =>
        console.error("[expiry-cron] Unexpected error:", err)
      );
    }
  };

  // Check every 60 seconds
  setInterval(tick, 60_000);

  console.log("[expiry-cron] ⏰ Certificate expiry cron started (fires at 09:00 Europe/Madrid)");
}
