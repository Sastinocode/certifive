import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { certifications, users, documentos } from "../../shared/schema";
import { authenticate } from "../auth";
import { nanoid } from "nanoid";
import multer from "multer";
import path from "path";
import { uploadToCloudinary } from "../cloudinary";
import { createNotification } from "../createNotification";

// ─────────────────────────────────────────────────────────────────────────────
// Multer — memoria únicamente. Cloudinary recibe el buffer directamente.
// ─────────────────────────────────────────────────────────────────────────────
const tecnicoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB — fotos móvil pueden ser grandes
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
export function registerFormularioTecnicoRoutes(app: Express) {

  // ── CERTIFIER: genera token y devuelve enlace ─────────────────────────────
  app.post(
    "/api/certifications/:id/generate-formulario-tecnico",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);

        const [cert] = await db
          .select()
          .from(certifications)
          .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
          .limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        // Reutiliza token existente o crea uno nuevo
        const token = cert.tecnicoToken ?? nanoid(32);
        await db
          .update(certifications)
          .set({
            tecnicoToken:      token,
            tecnicoFormStatus: cert.tecnicoFormStatus ?? "enviado",
            tecnicoFormSentAt: cert.tecnicoFormSentAt ?? new Date(),
            updatedAt:         new Date(),
          })
          .where(eq(certifications.id, certId));

        const host = req.headers.host ?? "localhost:5000";
        const protocol =
          (req.headers["x-forwarded-proto"] as string) ??
          (process.env.NODE_ENV === "production" ? "https" : "http");
        const url = `${protocol}://${host}/formulario-tecnico/${token}`;

        res.json({ token, url, tecnicoFormStatus: cert.tecnicoFormStatus ?? "enviado" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al generar el enlace" });
      }
    }
  );

  // ── PUBLIC: carga datos del formulario (sin auth) ─────────────────────────
  app.get("/api/formulario-tecnico/:token", async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.tecnicoToken, req.params.token))
        .limit(1);

      if (!cert) return res.status(404).json({ message: "Enlace inválido o expirado" });

      if (cert.tecnicoFormStatus === "completado") {
        return res.json({ completed: true });
      }

      const [certifier] = await db
        .select({
          name:      users.name,
          firstName: users.firstName,
          company:   users.company,
          phone:     users.phone,
        })
        .from(users)
        .where(eq(users.id, cert.userId!))
        .limit(1);

      res.json({
        completed: false,
        certId:    cert.id,
        certifier: {
          name:    certifier?.name ?? certifier?.firstName ?? "Tu certificador",
          company: certifier?.company ?? null,
          phone:   certifier?.phone ?? null,
        },
        prefill: {
          ownerName:          cert.ownerName          ?? "",
          address:            cert.address            ?? "",
          city:               cert.city               ?? "",
          cadastralReference: cert.cadastralReference ?? "",
          constructionYear:   cert.constructionYear   ?? "",
          totalArea:          cert.totalArea          ?? "",
          numPlantas:         cert.numPlantas         ?? "",
        },
        savedData: cert.tecnicoFormData ?? null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error al cargar el formulario" });
    }
  });

  // ── PUBLIC: marca como abierto ────────────────────────────────────────────
  app.post("/api/formulario-tecnico/:token/open", async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.tecnicoToken, req.params.token))
        .limit(1);
      if (!cert || cert.tecnicoFormStatus === "completado") return res.json({ ok: true });

      if (cert.tecnicoFormStatus === "enviado") {
        await db
          .update(certifications)
          .set({
            tecnicoFormStatus:   "abierto",
            tecnicoFormOpenedAt: new Date(),
            updatedAt:           new Date(),
          })
          .where(eq(certifications.id, cert.id));
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true }); // Nunca fallar en el tracking de apertura
    }
  });

  // ── PUBLIC: autoguarda progreso ───────────────────────────────────────────
  app.post("/api/formulario-tecnico/:token/save", async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.tecnicoToken, req.params.token))
        .limit(1);
      if (!cert || cert.tecnicoFormStatus === "completado")
        return res.json({ ok: true });

      await db
        .update(certifications)
        .set({
          tecnicoFormData:   req.body,
          tecnicoFormStatus: "guardado",
          updatedAt:         new Date(),
        })
        .where(eq(certifications.id, cert.id));

      res.json({ ok: true });
    } catch {
      res.json({ ok: true }); // El autoguardado nunca debe bloquear al usuario
    }
  });

  // ── PUBLIC: envío final ───────────────────────────────────────────────────
  app.post("/api/formulario-tecnico/:token/submit", async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.tecnicoToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
      if (cert.tecnicoFormStatus === "completado") {
        return res.status(409).json({ message: "Este formulario ya fue enviado" });
      }

      await db
        .update(certifications)
        .set({
          tecnicoFormData:         req.body,
          tecnicoFormStatus:       "completado",
          tecnicoFormCompletedAt:  new Date(),
          tecnicoFormReviewStatus: "pendiente_revision",
          workflowStatus:          "formulario_tecnico_completado",
          status:                  "En Proceso",
          updatedAt:               new Date(),
        })
        .where(eq(certifications.id, cert.id));

      // Notificación in-app al certificador
      const ownerName = cert.ownerName ?? "El propietario";
      const address   = cert.address   ?? "";
      createNotification({
        userId:          cert.userId!,
        tipo:            "cee_completado",
        mensaje:         `${ownerName} completó el formulario técnico guiado${address ? ` — ${address}` : ""}. Revisa los datos.`,
        certificationId: cert.id,
        metadata:        { ownerName, address, tipo: "formulario_tecnico" },
      }).catch(console.error);

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error al enviar el formulario" });
    }
  });

  // ── PUBLIC: subida de foto durante el formulario guiado — Cloudinary ──────
  app.post(
    "/api/formulario-tecnico/:token/upload/:certId",
    tecnicoUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });

        const certId = parseInt(req.params.certId);
        const { categoria = "foto_tecnica" } = req.body;

        // Verifica que el token corresponde al certId
        const [cert] = await db
          .select({ id: certifications.id, tecnicoToken: certifications.tecnicoToken })
          .from(certifications)
          .where(eq(certifications.id, certId))
          .limit(1);
        if (!cert || cert.tecnicoToken !== req.params.token) {
          return res.status(403).json({ message: "No autorizado" });
        }

        // Sube a Cloudinary — carpeta organizada por cert y categoría
        const { secure_url, public_id } = await uploadToCloudinary(req.file.buffer, {
          folder:          `certifive/certs/${certId}/tecnico`,
          resource_type:   "image",
          allowed_formats: ["jpg", "jpeg", "png", "heic", "heif", "webp"],
        });

        const [doc] = await db
          .insert(documentos)
          .values({
            certificationId: certId,
            nombreOriginal:  req.file.originalname,
            nombreArchivo:   public_id,   // Cloudinary public_id (para borrar)
            path:            secure_url,  // Cloudinary HTTPS URL (para mostrar)
            mimeType:        req.file.mimetype,
            tamano:          req.file.size,
            tipoDoc:         categoria,
            subidoPor:       "cliente",
            estadoRevision:  "pendiente",
          })
          .returning();

        res.json({ id: doc.id, nombre: doc.nombreArchivo, url: doc.path });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al subir la foto" });
      }
    }
  );

  // ── CERTIFIER: obtiene datos enviados para revisión (auth) ────────────────
  app.get(
    "/api/certifications/:id/tecnico-form-data",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);

        const [cert] = await db
          .select()
          .from(certifications)
          .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
          .limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        // Fotos subidas durante el formulario técnico
        const photos = await db
          .select()
          .from(documentos)
          .where(
            and(
              eq(documentos.certificationId, certId),
              eq(documentos.subidoPor, "cliente")
            )
          );

        const tecnicoPhotos = photos.filter(
          (d) => d.tipoDoc?.startsWith("foto_") || d.tipoDoc === "foto_tecnica"
        );

        res.json({
          tecnicoFormStatus:       cert.tecnicoFormStatus,
          tecnicoFormData:         cert.tecnicoFormData,
          tecnicoFormCompletedAt:  cert.tecnicoFormCompletedAt,
          tecnicoFormReviewStatus: cert.tecnicoFormReviewStatus,
          tecnicoFormReviewNotes:  cert.tecnicoFormReviewNotes,
          photos:                  tecnicoPhotos,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al cargar datos del formulario" });
      }
    }
  );

  // ── CERTIFIER: envía decisión de revisión (auth) ──────────────────────────
  app.post(
    "/api/certifications/:id/tecnico-form-review",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        // "validado" | "visita_complementaria" | "visita_completa"
        const { reviewStatus, reviewNotes } = req.body;

        if (!reviewStatus) {
          return res.status(400).json({ message: "reviewStatus es obligatorio" });
        }

        const [cert] = await db
          .select()
          .from(certifications)
          .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
          .limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const newWorkflowStatus =
          reviewStatus === "validado"
            ? "datos_tecnicos_validados"
            : reviewStatus === "visita_complementaria"
            ? "requiere_visita_complementaria"
            : "requiere_visita_completa";

        await db
          .update(certifications)
          .set({
            tecnicoFormReviewStatus: reviewStatus,
            tecnicoFormReviewNotes:  reviewNotes ?? null,
            tecnicoFormReviewedAt:   new Date(),
            workflowStatus:          newWorkflowStatus,
            updatedAt:               new Date(),
          })
          .where(eq(certifications.id, certId));

        res.json({ ok: true, workflowStatus: newWorkflowStatus });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al guardar la revisión" });
      }
    }
  );
}
