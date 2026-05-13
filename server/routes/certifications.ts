import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { certifications, folders, insertCertificationSchema } from "../../shared/schema";
import { authenticate } from "../auth";
import { createNotification } from "../createNotification";

export function registerCertificationRoutes(app: Express) {
// --- CERTIFICATIONS ---

app.get("/api/certifications", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { search, status, archived } = req.query;
    const results = await db.select().from(certifications).where(
      and(
        eq(certifications.userId, userId),
        archived === "true" ? eq(certifications.isArchived, true) : eq(certifications.isArchived, false),
      )
    ).orderBy(desc(certifications.createdAt));

    let filtered = results;
    if (search) {
      const s = (search as string).toLowerCase();
      filtered = filtered.filter(c =>
        c.ownerName?.toLowerCase().includes(s) ||
        c.address?.toLowerCase().includes(s) ||
        c.cadastralReference?.toLowerCase().includes(s)
      );
    }
    if (status) filtered = filtered.filter(c => c.status === status);

    res.json(filtered);
  } catch {
    res.status(500).json({ message: "Error al obtener certificaciones" });
  }
});

app.get("/api/certifications/recent", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;
    const [cert] = await db.insert(certifications).values({ ...req.body, userId }).returning();
    res.status(201).json(cert);
  } catch {
    res.status(500).json({ message: "Error al crear certificación" });
  }
});

app.put("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [cert] = await db.update(certifications)
      .set({ ...req.body, updatedAt: new Date() })
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
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;
    await db.delete(certifications).where(
      and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId))
    );
    res.json({ message: "Eliminada" });
  } catch {
    res.status(500).json({ message: "Error al eliminar certificación" });
  }
});

}
