/**
 * CERTIFIVE — Rutas del panel de administración
 *
 * Todas las rutas aquí requieren:
 *   1. Autenticación válida (JWT)
 *   2. role === "admin"
 *
 * Endpoints:
 *   GET  /api/admin/stats          — métricas globales del sistema
 *   GET  /api/admin/users          — listado paginado de usuarios
 *   PATCH /api/admin/users/:id/role — cambiar rol de un usuario
 *   PATCH /api/admin/users/:id/status — activar / desactivar cuenta
 */
import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, certifications } from "../../shared/schema";
import { authenticate } from "../auth";
import { eq, desc, ilike, or, sql, count } from "drizzle-orm";

// ── Middleware: solo admins ───────────────────────────────────────────────────

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Acceso restringido a administradores" });
  }
  next();
}

export function registerAdminRoutes(app: Express) {

  // ── GET /api/admin/stats ────────────────────────────────────────────────────
  app.get("/api/admin/stats", authenticate, requireAdmin, async (_req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalCerts,
        planCounts,
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users)
          .where(eq(users.subscriptionStatus, "active")),
        db.select({ count: count() }).from(certifications),
        db.select({
          plan: users.subscriptionPlan,
          count: count(),
        }).from(users).groupBy(users.subscriptionPlan),
      ]);

      res.json({
        totalUsers:   totalUsers[0]?.count  ?? 0,
        activeUsers:  activeUsers[0]?.count ?? 0,
        totalCerts:   totalCerts[0]?.count  ?? 0,
        planBreakdown: planCounts,
      });
    } catch (err) {
      console.error("[admin/stats]", err);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // ── GET /api/admin/users ────────────────────────────────────────────────────
  // Query params: page (default 1), limit (default 20), search (email/username)
  app.get("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
      const search = (req.query.search as string | undefined)?.trim();
      const offset = (page - 1) * limit;

      const whereClause = search
        ? or(
            ilike(users.email,    `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.name,     `%${search}%`),
          )
        : undefined;

      const [rows, total] = await Promise.all([
        db.select({
          id:                 users.id,
          username:           users.username,
          email:              users.email,
          name:               users.name,
          role:               users.role,
          subscriptionPlan:   users.subscriptionPlan,
          subscriptionStatus: users.subscriptionStatus,
          emailVerifiedAt:    users.emailVerifiedAt,
          isActive:           users.isActive,
          createdAt:          users.createdAt,
        })
          .from(users)
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(users).where(whereClause),
      ]);

      res.json({
        users: rows,
        pagination: {
          page,
          limit,
          total: total[0]?.count ?? 0,
          pages: Math.ceil((total[0]?.count ?? 0) / limit),
        },
      });
    } catch (err) {
      console.error("[admin/users]", err);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  // ── PATCH /api/admin/users/:id/role ────────────────────────────────────────
  app.patch("/api/admin/users/:id/role", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body as { role: string };

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Rol inválido. Usa 'user' o 'admin'" });
      }
      // Evita que el admin se quite su propio rol
      if (req.user!.id === userId && role !== "admin") {
        return res.status(400).json({ message: "No puedes quitarte tu propio rol de admin" });
      }

      const [updated] = await db
        .update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ id: users.id, role: users.role });

      if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
      res.json(updated);
    } catch (err) {
      console.error("[admin/role]", err);
      res.status(500).json({ message: "Error al actualizar rol" });
    }
  });

  // ── PATCH /api/admin/users/:id/status ──────────────────────────────────────
  app.patch("/api/admin/users/:id/status", authenticate, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body as { isActive: boolean };

      if (req.user!.id === userId) {
        return res.status(400).json({ message: "No puedes desactivar tu propia cuenta" });
      }

      const [updated] = await db
        .update(users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ id: users.id, isActive: users.isActive });

      if (!updated) return res.status(404).json({ message: "Usuario no encontrado" });
      res.json(updated);
    } catch (err) {
      console.error("[admin/status]", err);
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  });
}
