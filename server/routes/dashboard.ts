import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, sql, count } from "drizzle-orm";
import { certifications } from "../../shared/schema";
import { authenticate } from "../auth";

export function registerDashboardRoutes(app: Express) {

  app.get("/api/dashboard/stats", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const now = new Date();

      // ── Límites de mes actual y anterior ────────────────────────────────────
      const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth  = startOfMonth;

      // ── 1. Breakdown por estado (no archivados) ──────────────────────────────
      const statusRows = await db
        .select({ status: certifications.status, cnt: count() })
        .from(certifications)
        .where(and(eq(certifications.userId, userId), eq(certifications.isArchived, false)))
        .groupBy(certifications.status);

      const byStatus: Record<string, number> = {};
      let activeCertificates = 0;
      let inProgress = 0;
      for (const row of statusRows) {
        const n = Number(row.cnt);
        byStatus[row.status] = n;
        activeCertificates += n;
        if (row.status === "En Proceso") inProgress = n;
      }

      // Archivados
      const [archivedRow] = await db
        .select({ cnt: count() })
        .from(certifications)
        .where(and(eq(certifications.userId, userId), eq(certifications.isArchived, true)));
      byStatus["Archivado"] = Number(archivedRow.cnt);

      // ── 2. Ingresos: tramo1 + tramo2 pagados (mes actual vs anterior) ────────
      const incomeResult = await db.execute(sql`
        SELECT
          COALESCE(SUM(
            CASE WHEN tramo1_paid_at >= ${startOfMonth.toISOString()} THEN CAST(tramo1_amount AS NUMERIC) ELSE 0 END +
            CASE WHEN tramo2_paid_at >= ${startOfMonth.toISOString()} THEN CAST(tramo2_amount AS NUMERIC) ELSE 0 END
          ), 0) AS current_income,
          COALESCE(SUM(
            CASE WHEN tramo1_paid_at >= ${startOfPrevMonth.toISOString()} AND tramo1_paid_at < ${endOfPrevMonth.toISOString()} THEN CAST(tramo1_amount AS NUMERIC) ELSE 0 END +
            CASE WHEN tramo2_paid_at >= ${startOfPrevMonth.toISOString()} AND tramo2_paid_at < ${endOfPrevMonth.toISOString()} THEN CAST(tramo2_amount AS NUMERIC) ELSE 0 END
          ), 0) AS prev_income
        FROM certifications
        WHERE user_id = ${userId}
      `);

      const monthlyIncomeCurrent = Number((incomeResult.rows[0] as any)?.current_income ?? 0);
      const monthlyIncomePrev    = Number((incomeResult.rows[0] as any)?.prev_income    ?? 0);

      // ── 3. Tiempo medio de certificación (días desde creación a archivedAt) ──
      const avgResult = await db.execute(sql`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (archived_at - created_at)) / 86400)) AS avg_days
        FROM certifications
        WHERE user_id = ${userId}
          AND is_archived = true
          AND archived_at IS NOT NULL
      `);
      const avgDaysToComplete = Number((avgResult.rows[0] as any)?.avg_days ?? 0);

      // ── 4. Clientes nuevos (distinct owner_email por mes) ───────────────────
      const clientsResult = await db.execute(sql`
        SELECT
          COUNT(DISTINCT CASE WHEN created_at >= ${startOfMonth.toISOString()} THEN owner_email END)     AS new_this_month,
          COUNT(DISTINCT CASE WHEN created_at >= ${startOfPrevMonth.toISOString()} AND created_at < ${endOfPrevMonth.toISOString()} THEN owner_email END) AS new_prev_month
        FROM certifications
        WHERE user_id = ${userId}
          AND owner_email IS NOT NULL
      `);
      const newClientsThisMonth = Number((clientsResult.rows[0] as any)?.new_this_month ?? 0);
      const newClientsPrevMonth = Number((clientsResult.rows[0] as any)?.new_prev_month ?? 0);

      // ── 5. Tendencia mensual: certificados creados en los últimos 6 meses ───
      const trendResult = await db.execute(sql`
        SELECT
          TO_CHAR(created_at AT TIME ZONE 'Europe/Madrid', 'YYYY-MM') AS month,
          COUNT(*)::int AS total
        FROM certifications
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month ASC
      `);
      const monthlyTrend = (trendResult.rows as any[]).map(r => ({
        month: r.month as string,
        total: Number(r.total),
      }));

      // ── Respuesta ────────────────────────────────────────────────────────────
      res.json({
        // Por estado
        byStatus,
        activeCertificates,
        inProgress,
        completedTotal: byStatus["Finalizado"] ?? 0,
        // Ingresos
        monthlyIncome: {
          current:  monthlyIncomeCurrent,
          previous: monthlyIncomePrev,
        },
        // Tiempo medio
        avgDaysToComplete,
        // Clientes
        newClientsThisMonth,
        newClientsPrevMonth,
        // Tendencia
        monthlyTrend,
        // Legacy (backward compat con la card "Ingresos del Mes" existente)
        expiringSoon: 0,
        monthlyIncome_legacy: monthlyIncomeCurrent,
      });
    } catch (err) {
      console.error("[dashboard/stats]", err);
      res.status(500).json({ message: "Error al obtener estadísticas del dashboard" });
    }
  });

}
