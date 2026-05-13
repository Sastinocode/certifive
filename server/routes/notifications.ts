import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, gte } from "drizzle-orm";
import { notificaciones } from "../../shared/schema";
import { authenticate } from "../auth";
import { verifyToken } from "../auth";
import { subscribe as sseSubscribe } from "../sse";

export function registerNotificationRoutes(app: Express) {
// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS — SSE stream + REST endpoints
// ─────────────────────────────────────────────────────────────────────────

/**
 * SSE stream endpoint.
 * The client appends ?token=<jwt> because EventSource cannot send
 * custom headers. We validate it here as a query-param bearer token.
 */
app.get("/api/notifications/stream", async (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No autorizado" });

  let userId: number;
  try {
    const payload = verifyToken(token) as any;
    userId = payload.id ?? payload.userId;
    if (!userId) throw new Error("no userId in token");
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }

  sseSubscribe(userId, res);
  // Note: response stays open — sseSubscribe owns it from here on
});

/** List last 20 notifications for the authenticated user. */
app.get("/api/notifications", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const rows = await db
      .select()
      .from(notificaciones)
      .where(eq(notificaciones.userId, userId))
      .orderBy(desc(notificaciones.createdAt))
      .limit(20);

    const unreadCount = rows.filter(n => !n.leida).length;
    res.json({ notifications: rows, unreadCount });
  } catch {
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
});

/** Activity feed for the dashboard — last 10 events from the past 24 h. */
app.get("/api/activity", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id ?? (req as any).userId;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await db
      .select()
      .from(notificaciones)
      .where(and(eq(notificaciones.userId, userId), gte(notificaciones.createdAt, since)))
      .orderBy(desc(notificaciones.createdAt))
      .limit(10);

    res.json(rows);
  } catch {
    res.status(500).json({ message: "Error al obtener actividad" });
  }
});

/** Mark one notification as read. */
app.patch("/api/notifications/:id/read", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId ?? (req as any).user?.id;
    const id = parseInt(req.params.id);
    await db
      .update(notificaciones)
      .set({ leida: true })
      .where(and(eq(notificaciones.id, id), eq(notificaciones.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al marcar notificación" });
  }
});

/** Mark ALL notifications as read. */
app.patch("/api/notifications/read-all", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId ?? (req as any).user?.id;
    await db
      .update(notificaciones)
      .set({ leida: true })
      .where(and(eq(notificaciones.userId, userId), eq(notificaciones.leida, false)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al marcar notificaciones" });
  }
});

}
