import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { certifications } from "../../shared/schema";
import { authenticate } from "../auth";

export type AlertType =
  | "deadline_overdue"   // plazo de entrega ya vencido
  | "deadline_soon"      // plazo vence en ≤ 3 días
  | "payment_pending"    // presupuesto aceptado pero tramo1 sin pagar
  | "form_pending";      // formulario CEE enviado pero sin completar

export interface Alert {
  type: AlertType;
  priority: "high" | "medium" | "low";
  certId: number;
  ownerName: string | null;
  address: string | null;
  daysLeft: number | null;   // negativo = vencido hace N días
  message: string;
}

export function registerAlertRoutes(app: Express) {

  app.get("/api/dashboard/alerts", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const now = new Date();
      const alerts: Alert[] = [];

      // ── Carga certificaciones activas (no archivadas, no finalizadas) ────────
      const active = await db
        .select({
          id: certifications.id,
          ownerName: certifications.ownerName,
          address: certifications.address,
          createdAt: certifications.createdAt,
          plazoEntregaDias: certifications.plazoEntregaDias,
          status: certifications.status,
          tramo1PaidAt: certifications.tramo1PaidAt,
          presupuestoAceptadoAt: certifications.presupuestoAceptadoAt,
          ceeFormSentAt: certifications.ceeFormSentAt,
          ceeFormCompletedAt: certifications.ceeFormCompletedAt,
        })
        .from(certifications)
        .where(
          and(
            eq(certifications.userId, userId),
            eq(certifications.isArchived, false),
            ne(certifications.status, "Finalizado"),
          )
        );

      for (const cert of active) {

        // ── 1. Alertas de plazo de entrega ───────────────────────────────────
        if (cert.plazoEntregaDias && cert.plazoEntregaDias > 0) {
          const deadline = new Date(cert.createdAt);
          deadline.setDate(deadline.getDate() + cert.plazoEntregaDias);
          const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);

          if (daysLeft < 0) {
            alerts.push({
              type: "deadline_overdue",
              priority: "high",
              certId: cert.id,
              ownerName: cert.ownerName,
              address: cert.address,
              daysLeft,
              message: `Plazo de entrega vencido hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) !== 1 ? "s" : ""}`,
            });
          } else if (daysLeft <= 3) {
            alerts.push({
              type: "deadline_soon",
              priority: daysLeft === 0 ? "high" : "medium",
              certId: cert.id,
              ownerName: cert.ownerName,
              address: cert.address,
              daysLeft,
              message: daysLeft === 0
                ? "Plazo de entrega: hoy"
                : `Plazo de entrega en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
            });
          }
        }

        // ── 2. Pago pendiente (presupuesto aceptado, tramo1 sin pagar) ───────
        if (cert.presupuestoAceptadoAt && !cert.tramo1PaidAt) {
          const daysSince = Math.floor(
            (now.getTime() - new Date(cert.presupuestoAceptadoAt).getTime()) / 86_400_000
          );
          alerts.push({
            type: "payment_pending",
            priority: daysSince > 7 ? "high" : "medium",
            certId: cert.id,
            ownerName: cert.ownerName,
            address: cert.address,
            daysLeft: daysSince,
            message: `Presupuesto aceptado hace ${daysSince}d sin pago. Tramo 1 pendiente.`,
          });
        }

        // ── 3. Formulario CEE enviado sin completar ───────────────────────────
        if (cert.ceeFormSentAt && !cert.ceeFormCompletedAt) {
          const daysSince = Math.floor(
            (now.getTime() - new Date(cert.ceeFormSentAt).getTime()) / 86_400_000
          );
          alerts.push({
            type: "form_pending",
            priority: daysSince > 5 ? "medium" : "low",
            certId: cert.id,
            ownerName: cert.ownerName,
            address: cert.address,
            daysLeft: daysSince,
            message: `Formulario CEE enviado hace ${daysSince}d, sin respuesta del propietario.`,
          });
        }
      }

      // Ordenar: high → medium → low, luego por daysLeft
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      alerts.sort((a, b) => {
        const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pd !== 0) return pd;
        return (a.daysLeft ?? 0) - (b.daysLeft ?? 0);
      });

      res.json(alerts);
    } catch (err) {
      console.error("[dashboard/alerts]", err);
      res.status(500).json({ message: "Error al obtener alertas" });
    }
  });

}
