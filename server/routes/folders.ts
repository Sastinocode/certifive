import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { folders, insertFolderSchema } from "../../shared/schema";
import { authenticate } from "../auth";

export function registerFolderRoutes(app: Express) {
// --- FOLDERS ---

app.get("/api/folders", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await db.select().from(folders).where(eq(folders.userId, userId)).orderBy(desc(folders.createdAt));
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error al obtener carpetas" });
  }
});

app.post("/api/folders", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [folder] = await db.insert(folders).values({ ...req.body, userId }).returning();
    res.status(201).json(folder);
  } catch {
    res.status(500).json({ message: "Error al crear carpeta" });
  }
});

app.delete("/api/folders/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await db.delete(folders).where(and(eq(folders.id, parseInt(req.params.id)), eq(folders.userId, userId)));
    res.json({ message: "Eliminada" });
  } catch {
    res.status(500).json({ message: "Error al eliminar carpeta" });
  }
});

}
