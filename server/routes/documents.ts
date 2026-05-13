import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { documentos, certifications, users } from "../../shared/schema";
import { authenticate } from "../auth";
import { sendDocumentoRechazadoEmail } from "../email";
import { uploadToCloudinary, deleteFromCloudinary } from "../cloudinary";
import multer from "multer";
import path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Multer — memoria únicamente. Cloudinary recibe el buffer directamente.
// ─────────────────────────────────────────────────────────────────────────────
const certifierUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const ok = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".zip"];
    cb(null, ok.includes(path.extname(file.originalname).toLowerCase()));
  },
});

export function registerDocumentRoutes(app: Express) {

  // ── GET /api/certifications/:id/documentos ────────────────────────────────
  app.get("/api/certifications/:id/documentos", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);

      const [cert] = await db.select({ id: certifications.id })
        .from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      const docs = await db.select().from(documentos)
        .where(eq(documentos.certificationId, certId))
        .orderBy(documentos.fechaSubida);
      res.json(docs);
    } catch {
      res.status(500).json({ message: "Error al obtener documentos" });
    }
  });

  // ── POST /api/certifications/:id/documentos — certifier upload ────────────
  app.post(
    "/api/certifications/:id/documentos",
    authenticate,
    certifierUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        const { tipoDoc = "certificado" } = req.body;

        const [cert] = await db.select({ id: certifications.id })
          .from(certifications)
          .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
          .limit(1);
        if (!cert) return res.status(403).json({ message: "No autorizado" });

        // Upload to Cloudinary
        const { secure_url, public_id } = await uploadToCloudinary(req.file.buffer, {
          folder: `certifive/certs/${certId}`,
        });

        const [doc] = await db.insert(documentos).values({
          certificationId: certId,
          nombreOriginal: req.file.originalname,
          nombreArchivo:  public_id,   // Cloudinary public_id (needed for deletion)
          path:           secure_url,  // Cloudinary HTTPS URL (used to serve/preview)
          mimeType:       req.file.mimetype,
          tamano:         req.file.size,
          tipoDoc,
          subidoPor:      "certificador",
          estadoRevision: "revisado",
        }).returning();

        res.json(doc);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al subir documento" });
      }
    }
  );

  // ── PUT /api/documentos/:id/estado — update review state ─────────────────
  app.put("/api/documentos/:id/estado", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const docId = parseInt(req.params.id);
      const { estadoRevision, motivoRechazo } = req.body;

      const [doc] = await db.select().from(documentos).where(eq(documentos.id, docId)).limit(1);
      if (!doc) return res.status(404).json({ message: "Documento no encontrado" });

      const [cert] = await db
        .select({
          userId:     certifications.userId,
          ownerEmail: certifications.ownerEmail,
          ownerName:  certifications.ownerName,
          address:    certifications.address,
          ceeToken:   certifications.ceeToken,
        })
        .from(certifications)
        .where(eq(certifications.id, doc.certificationId))
        .limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      const [updated] = await db
        .update(documentos)
        .set({ estadoRevision, motivoRechazo: motivoRechazo || null })
        .where(eq(documentos.id, docId))
        .returning();

      // Notify owner if rejected
      if (estadoRevision === "rechazado" && cert.ownerEmail && motivoRechazo && cert.ceeToken) {
        const [certifier] = await db
          .select({ name: users.name, username: users.username })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        const host = req.headers.host ?? "localhost:5000";
        const protocol =
          (req.headers["x-forwarded-proto"] as string) ??
          (process.env.NODE_ENV === "production" ? "https" : "http");

        const tipoLabels: Record<string, string> = {
          factura_luz:        "Factura de electricidad",
          factura_gas:        "Factura de gas",
          referencia_catastral: "Referencia catastral",
          planos:             "Planos del inmueble",
          certificado:        "Certificado",
          otro:               "Documento adjunto",
        };

        sendDocumentoRechazadoEmail({
          to:            cert.ownerEmail,
          ownerName:     cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          tipoDoc:       tipoLabels[doc.tipoDoc] ?? doc.tipoDoc,
          motivo:        motivoRechazo,
          ceeFormUrl:    `${protocol}://${host}/formulario-cee/${cert.ceeToken}`,
        });
      }

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Error al actualizar documento" });
    }
  });

  // ── DELETE /api/documentos/:id ────────────────────────────────────────────
  app.delete("/api/documentos/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const docId = parseInt(req.params.id);

      const [doc] = await db.select().from(documentos).where(eq(documentos.id, docId)).limit(1);
      if (!doc) return res.status(404).json({ message: "Documento no encontrado" });

      const [cert] = await db
        .select({ userId: certifications.userId })
        .from(certifications)
        .where(eq(certifications.id, doc.certificationId))
        .limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      // Delete from Cloudinary (nombreArchivo stores the public_id)
      if (doc.nombreArchivo) {
        await deleteFromCloudinary(doc.nombreArchivo);
      }

      await db.delete(documentos).where(eq(documentos.id, docId));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al eliminar documento" });
    }
  });

  // ── GET /api/uploads/:certId/:filename — redirige a URL de Cloudinary ─────
  // La URL pública ya está en doc.path. Este endpoint mantiene compatibilidad
  // con cualquier frontend que use la ruta antigua.
  app.get("/api/uploads/:certId/:filename", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.certId);

      const [cert] = await db
        .select({ userId: certifications.userId })
        .from(certifications)
        .where(eq(certifications.id, certId))
        .limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      // Find the doc by public_id (stored in nombreArchivo) or by original filename
      const docs = await db
        .select()
        .from(documentos)
        .where(eq(documentos.certificationId, certId));

      const doc = docs.find(
        (d) =>
          d.nombreArchivo === req.params.filename ||
          d.nombreOriginal === req.params.filename
      );

      if (!doc || !doc.path) return res.status(404).json({ message: "Archivo no encontrado" });

      // Redirect to Cloudinary URL
      res.redirect(doc.path);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });
}
