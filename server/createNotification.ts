/**
 * CERTIFIVE — Notification creator
 *
 * Single entry point for creating a notification record AND pushing it
 * to any live SSE connections for that certifier.
 *
 * Usage:
 *   await createNotification({
 *     userId: cert.userId,
 *     tipo: "solicitud_completada",
 *     mensaje: "María García completó el formulario de tasación",
 *     certificationId: cert.id,
 *   });
 */

import { db } from "./db";
import { notificaciones } from "../shared/schema";
import { publish } from "./sse";

// ── Notification types ────────────────────────────────────────────────────────

export type NotiTipo =
  | "solicitud_completada"    // owner filled solicitud form
  | "presupuesto_aceptado"    // owner accepted quote
  | "pago_recibido"           // payment confirmed (tramo 1 or 2)
  | "pago_fallido"            // payment rejected by certifier
  | "cee_completado"          // owner submitted CEE detailed form
  | "recordatorio_formulario" // automated 48h/72h reminder fired

export interface CreateNotificationOpts {
  userId: number;
  tipo: NotiTipo;
  mensaje: string;
  certificationId?: number | null;
  metadata?: Record<string, unknown>;
}

// ── Main helper ───────────────────────────────────────────────────────────────

export async function createNotification(
  opts: CreateNotificationOpts
): Promise<void> {
  const { userId, tipo, mensaje, certificationId, metadata } = opts;

  let notif;
  try {
    [notif] = await db
      .insert(notificaciones)
      .values({
        userId,
        certificationId: certificationId ?? null,
        tipo,
        mensaje,
        leida: false,
        metadata: metadata ?? null,
      })
      .returning();
  } catch (err) {
    console.error("[notify] DB insert failed:", err);
    return;
  }

  // Push immediately to any live SSE connections for this user.
  // Errors here must NOT bubble up — the HTTP response may have already ended.
  try {
    publish(userId, "notification", {
      id:               notif.id,
      tipo,
      mensaje,
      certificationId:  certificationId ?? null,
      metadata:         metadata ?? null,
      leida:            false,
      createdAt:        notif.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[notify] SSE publish failed:", err);
  }
}
