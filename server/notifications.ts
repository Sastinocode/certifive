/**
 * CERTIFIVE — Notification dispatcher
 *
 * Single entry point for ALL client-facing messages.
 * Automatically selects WhatsApp (360dialog) or SendGrid email
 * depending on whether the certifier has a connected WhatsApp account.
 *
 * Every send — success or failure — is recorded in mensajes_comunicacion.
 *
 * Usage:
 *   await sendNotification({ certificationId: 42, tipo: 1 });
 *   await sendNotification({ certificationId: 42, tipo: "manual", manualText: "..." });
 */

import { db } from "./db";
import {
  certifications,
  users,
  mensajesComunicacion,
  plantillasWhatsapp,
} from "../shared/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptApiKey,
  sendWhatsAppText,
  sendWhatsAppDocument,
  DEFAULT_TEMPLATES,
  fillTemplate,
} from "./whatsapp";
import {
  sendSolicitudLinkEmail,
  sendPresupuestoEmail,
  sendPagoConfirmadoEmail,
  sendCEEFormLinkEmail,
  sendPaymentLinkEmail,
} from "./email";

const APP_URL = (process.env.APP_URL ?? "https://certifive.es").replace(/\/$/, "");

export type MsgTipo = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | "manual";

export interface NotificationOpts {
  certificationId: number;
  tipo: MsgTipo;
  /** Override individual template vars */
  extraVars?: Record<string, string>;
  /** Only for tipo === "manual" */
  manualText?: string;
  /** Only for tipo === 8: public URL to the certificate PDF */
  documentUrl?: string;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function sendNotification(opts: NotificationOpts): Promise<void> {
  const { certificationId, tipo, extraVars = {}, manualText, documentUrl } = opts;

  // ── Load certification + certifier ────────────────────────────────────────
  const [cert] = await db
    .select()
    .from(certifications)
    .where(eq(certifications.id, certificationId));
  if (!cert) {
    console.warn("[notify] cert not found:", certificationId);
    return;
  }

  const [certifier] = await db
    .select()
    .from(users)
    .where(eq(users.id, cert.userId));
  if (!certifier) {
    console.warn("[notify] certifier not found for cert:", certificationId);
    return;
  }

  // ── Build variable map ────────────────────────────────────────────────────
  const certifierName =
    (certifier as any).name ??
    (certifier as any).firstName ??
    certifier.username;

  const vars: Record<string, string> = {
    nombre:                  cert.ownerName ?? "cliente",
    nombre_certificador:     certifierName,
    precio:                  cert.finalPrice
      ? parseFloat(cert.finalPrice).toFixed(2)
      : "—",
    link_formulario_tasacion: cert.solicitudToken
      ? `${APP_URL}/solicitud/${cert.solicitudToken}`
      : "",
    link_presupuesto:         cert.presupuestoToken
      ? `${APP_URL}/presupuesto/${cert.presupuestoToken}`
      : "",
    link_formulario_cee:      cert.ceeToken
      ? `${APP_URL}/formulario-cee/${cert.ceeToken}`
      : "",
    link_pago_tramo2:         cert.paymentToken
      ? `${APP_URL}/pay/${cert.paymentToken}`
      : "",
    ...extraVars,
  };

  // ── Resolve message text ─────────────────────────────────────────────────
  let text = manualText ?? "";
  if (!manualText && typeof tipo === "number") {
    // Look for a custom template in DB
    const [custom] = await db
      .select()
      .from(plantillasWhatsapp)
      .where(
        and(
          eq(plantillasWhatsapp.userId, cert.userId),
          eq(plantillasWhatsapp.tipoMensaje, tipo)
        )
      );
    const template = custom?.contenido ?? DEFAULT_TEMPLATES[tipo] ?? "";
    text = fillTemplate(template, vars);
  }

  if (!text.trim()) {
    console.warn("[notify] empty message, skip. tipo:", tipo);
    return;
  }

  // ── Choose channel ────────────────────────────────────────────────────────
  const hasWA =
    !!(certifier as any).whatsappApiKey && !!(cert.ownerPhone);
  const canal: "whatsapp" | "email" = hasWA ? "whatsapp" : "email";

  let estado: "enviado" | "fallido" = "enviado";
  let errorDetalle: string | undefined;

  // ── Send ──────────────────────────────────────────────────────────────────
  if (canal === "whatsapp") {
    const apiKey = decryptApiKey((certifier as any).whatsappApiKey);
    let result: { ok: boolean; error?: string };

    if (tipo === 8 && documentUrl) {
      result = await sendWhatsAppDocument(
        apiKey,
        cert.ownerPhone!,
        documentUrl,
        "certificado-energetico.pdf",
        text
      );
    } else {
      result = await sendWhatsAppText(apiKey, cert.ownerPhone!, text);
    }

    if (!result.ok) {
      estado = "fallido";
      errorDetalle = result.error;
      console.error("[notify] WhatsApp failed:", errorDetalle);
    }
  } else {
    // Email fallback
    await _emailFallback(tipo, cert, certifier, vars);
  }

  // ── Persist log ───────────────────────────────────────────────────────────
  await db.insert(mensajesComunicacion).values({
    certificationId,
    canal,
    tipoMensaje: String(tipo),
    contenido:   text,
    estado,
    ...(errorDetalle ? { errorDetalle } : {}),
  });
}

// ─── Retry a failed message ───────────────────────────────────────────────────

export async function retryMensaje(mensajeId: number): Promise<void> {
  const [msg] = await db
    .select()
    .from(mensajesComunicacion)
    .where(eq(mensajesComunicacion.id, mensajeId));
  if (!msg || msg.estado !== "fallido") return;

  const tipo = msg.tipoMensaje === "manual"
    ? ("manual" as const)
    : (parseInt(msg.tipoMensaje ?? "0") as MsgTipo);

  await sendNotification({
    certificationId: msg.certificationId,
    tipo,
    manualText: msg.canal === "email" ? undefined : msg.contenido ?? undefined,
  });
}

// ─── Email fallback logic ─────────────────────────────────────────────────────

async function _emailFallback(
  tipo: MsgTipo,
  cert: any,
  certifier: any,
  vars: Record<string, string>
): Promise<void> {
  const email = cert.ownerEmail;
  if (!email) return;

  const ownerName      = cert.ownerName ?? "cliente";
  const certifierName  = vars.nombre_certificador;
  const certifierPhone = certifier.phone ?? null;
  const certifierCo    = certifier.company ?? null;
  const address        = cert.address ?? null;
  const amount         = parseFloat(cert.finalPrice ?? "0");

  switch (tipo) {
    case 1:
    case 2:
      await sendSolicitudLinkEmail({
        to: email, ownerName, certifierName,
        certifierPhone, certifierCompany: certifierCo,
        solicitudUrl: vars.link_formulario_tasacion,
        propertyAddress: address,
      });
      break;
    case 3:
      await sendPresupuestoEmail({
        to: email, ownerName, certifierName,
        certifierCompany: certifierCo,
        presupuestoUrl: vars.link_presupuesto,
        propertyAddress: address,
        amount,
        plazoEntregaDias: certifier.plazoEntregaDias ?? null,
      });
      break;
    case 4:
      await sendPagoConfirmadoEmail({
        to: email, ownerName, certifierName,
        amount: parseFloat(cert.tramo1Amount ?? "0"),
        tramo: 1,
        ceeFormUrl: vars.link_formulario_cee || null,
      });
      break;
    case 5:
    case 6:
      await sendCEEFormLinkEmail({
        to: email, ownerName, certifierName,
        ceeFormUrl: vars.link_formulario_cee,
        propertyAddress: address,
      });
      break;
    case 7:
      await sendPaymentLinkEmail({
        to: email, ownerName, certifierName,
        paymentUrl: vars.link_pago_tramo2,
        amount: parseFloat(cert.tramo2Amount ?? "0"),
        tramo: 2,
        propertyAddress: address,
      });
      break;
    case 8:
      // Certificate delivery — certifier handles it; no generic email fallback needed
      break;
    default:
      break;
  }
}

// ─── Cron reminders ───────────────────────────────────────────────────────────

/**
 * Call this once at server startup.
 * Checks every hour for certs that need automatic reminders.
 */
export function startReminderCron(): void {
  const ONE_HOUR = 60 * 60 * 1000;

  setInterval(async () => {
    try {
      await _sendOverdueSolicitudReminders();
      await _sendOverdueCeeReminders();
    } catch (err) {
      console.error("[cron] reminder error:", err);
    }
  }, ONE_HOUR);

  console.log("[cron] reminder jobs scheduled (hourly)");
}

/** Msg 2 — tasación sent 48h+ ago and still not completed */
async function _sendOverdueSolicitudReminders(): Promise<void> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(certifications)
    .where(eq(certifications.solicitudStatus, "enviado"));

  for (const cert of rows) {
    if (!cert.solicitudSentAt || cert.solicitudSentAt > cutoff) continue;
    console.log("[cron] sending solicitud reminder for cert", cert.id);
    await sendNotification({ certificationId: cert.id, tipo: 2 });
    // Update status to avoid repeated reminders
    await db
      .update(certifications)
      .set({ solicitudStatus: "recordatorio_enviado" })
      .where(eq(certifications.id, cert.id));
  }
}

/** Msg 6 — CEE form sent 72h+ ago and still not completed */
async function _sendOverdueCeeReminders(): Promise<void> {
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(certifications)
    .where(eq(certifications.ceeFormStatus, "enviado"));

  for (const cert of rows) {
    if (!cert.ceeFormSentAt || cert.ceeFormSentAt > cutoff) continue;
    console.log("[cron] sending CEE form reminder for cert", cert.id);
    await sendNotification({ certificationId: cert.id, tipo: 6 });
    await db
      .update(certifications)
      .set({ ceeFormStatus: "recordatorio_enviado" })
      .where(eq(certifications.id, cert.id));
  }
}
