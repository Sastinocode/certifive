import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, ilike, or, sql, count } from "drizzle-orm";
import { certifications, folders, insertCertificationSchema } from "../../shared/schema";
import { authenticate } from "../auth";
import { createNotification } from "../createNotification";
import { z } from "zod";

// ── Whitelist de campos que un usuario puede actualizar via PUT ───────────────
// NUNCA permitir: userId, id, createdAt, stripeCustomerId, etc.
const certUpdateSchema = insertCertificationSchema.partial().omit({
  userId: true,
  folderId: true,  // se gestiona via /archive
});
type CertUpdate = z.infer<typeof certUpdateSchema>;

export function registerCertificationRoutes(app: Express) {
// --- CERTIFICATIONS ---

app.get("/api/certifications", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { search, status, archived, page, pageSize } = req.query;

    // ── Paginación (opt-in: sólo activa si el cliente envía ?page=N) ─────────
    const paginated = page !== undefined;
    const pageNum  = Math.max(1, parseInt(page as string) || 1);
    const size     = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));
    const offset   = (pageNum - 1) * size;

    // Construir condiciones WHERE en SQL (evita cargar toda la tabla en memoria)
    const conditions: ReturnType<typeof eq>[] = [
      eq(certifications.userId, userId),
      archived === "true" ? eq(certifications.isArchived, true) : eq(certifications.isArchived, false),
    ];

    if (status) {
      conditions.push(eq(certifications.status, status as string));
    }

    if (search) {
      const s = `%${search}%`;
      conditions.push(
        or(
          ilike(certifications.ownerName, s),
          ilike(certifications.address, s),
          ilike(certifications.cadastralReference, s),
        ) as any,
      );
    }

    const where = and(...conditions);

    if (paginated) {
      // ── Respuesta paginada: { data, total, page, pageSize } ─────────────────
      const [{ total }] = await db
        .select({ total: count() })
        .from(certifications)
        .where(where);

      const data = await db.select().from(certifications)
        .where(where)
        .orderBy(desc(certifications.createdAt))
        .limit(size)
        .offset(offset);

      return res.json({ data, total, page: pageNum, pageSize: size });
    }

    // ── Respuesta plana (compatibilidad hacia atrás) ─────────────────────────
    const results = await db.select().from(certifications)
      .where(where)
      .orderBy(desc(certifications.createdAt));

    res.json(results);
  } catch {
    res.status(500).json({ message: "Error al obtener certificaciones" });
  }
});

app.get("/api/certifications/recent", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const results = await db.select().from(certifications)
      .where(and(eq(certifications.userId, userId), eq(certifications.isArchived, false)))
      .orderBy(desc(certifications.createdAt))
      .limit(10);
    res.json(results);
  } catch {
    res.status(500).json({ message: "Error al obtener certificaciones recientes" });
  }
});

app.get("/api/certifications/pending", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const results = await db.select().from(certifications)
      .where(and(eq(certifications.userId, userId), eq(certifications.isArchived, false)))
      .orderBy(desc(certifications.createdAt))
      .limit(20);
    const pending = results.filter(c => c.status !== "Finalizado" && c.status !== "Cancelado");
    res.json(pending);
  } catch {
    res.status(500).json({ message: "Error al obtener certificaciones pendientes" });
  }
});

app.get("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const [cert] = await db.select().from(certifications).where(
      and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId))
    ).limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });
    res.json(cert);
  } catch {
    res.status(500).json({ message: "Error al obtener certificación" });
  }
});

app.post("/api/certifications", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const [cert] = await db.insert(certifications).values({ ...req.body, userId }).returning();
    res.status(201).json(cert);
  } catch {
    res.status(500).json({ message: "Error al crear certificación" });
  }
});

app.put("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // ── Seguridad: whitelist estricta de campos actualizables ─────────────────
    // Rechaza campos desconocidos o protegidos (userId, stripeCustomerId, etc.)
    const parsed = certUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const [cert] = await db.update(certifications)
      .set({ ...(parsed.data as Partial<typeof certifications.$inferInsert>), updatedAt: new Date() })
      .where(and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId)))
      .returning();
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });
    res.json(cert);
  } catch {
    res.status(500).json({ message: "Error al actualizar certificación" });
  }
});
app.post("/api/certifications/:id/archive", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const certId = parseInt(req.params.id);
    const [existing] = await db.select().from(certifications).where(
      and(eq(certifications.id, certId), eq(certifications.userId, userId))
    ).limit(1);
    if (!existing) return res.status(404).json({ message: "Certificación no encontrada" });

    if (existing.ownerName) {
      const folderName = existing.ownerName;
      const existingFolder = await db.select().from(folders).where(
        and(eq(folders.userId, userId), eq(folders.name, folderName))
      ).limit(1);

      let folderId = existingFolder[0]?.id;
      if (!folderId) {
        const [folder] = await db.insert(folders).values({
          userId,
          name: folderName,
          clientName: existing.ownerName,
          cadastralReference: existing.cadastralReference || "",
        }).returning();
        folderId = folder.id;
      }

      const [updated] = await db.update(certifications)
        .set({ isArchived: true, archivedAt: new Date(), folderId, status: "Finalizado", updatedAt: new Date() })
        .where(eq(certifications.id, certId))
        .returning();
      return res.json(updated);
    }

    const [updated] = await db.update(certifications)
      .set({ isArchived: true, archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(certifications.id, certId))
      .returning();
    res.json(updated);
  } catch {
    res.status(500).json({ message: "Error al archivar certificación" });
  }
});

app.delete("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await db.delete(certifications).where(
      and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId))
    );
    res.json({ message: "Eliminada" });
  } catch {
    res.status(500).json({ message: "Error al eliminar certificación" });
  }
});

}
