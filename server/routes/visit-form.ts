// @ts-nocheck
import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  certifications,
  envelopeElements,
  openings,
  installations,
  improvementMeasures,
  visitPhotos,
} from "../../shared/schema";
import { authenticate } from "../auth";
import multer from "multer";
import { uploadToCloudinary, deleteFromCloudinary } from "../cloudinary";

const visitUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpe?g|png|heic|heif|webp)$/i.test(file.originalname);
    cb(null, ok);
  },
});

function certOwner(userId: number, certId: number) {
  return and(eq(certifications.id, certId), eq(certifications.userId, userId));
}

export function registerVisitFormRoutes(app: Express) {

  // ── GET full visit data ────────────────────────────────────────────────────
  app.get(
    "/api/certifications/:id/visit-data",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);

        const [cert] = await db
          .select()
          .from(certifications)
          .where(certOwner(userId, certId))
          .limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const [envelope, openingsList, installList, measures, photos] = await Promise.all([
          db.select().from(envelopeElements).where(eq(envelopeElements.certificationId, certId)),
          db.select().from(openings).where(eq(openings.certificationId, certId)),
          db.select().from(installations).where(eq(installations.certificationId, certId)),
          db.select().from(improvementMeasures).where(eq(improvementMeasures.certificationId, certId)),
          db.select().from(visitPhotos).where(eq(visitPhotos.certificationId, certId)),
        ]);

        res.json({ cert, envelope, openings: openingsList, installations: installList, measures, photos });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al cargar la ficha de visita" });
      }
    }
  );

  // ── ENVELOPE ───────────────────────────────────────────────────────────────
  app.post(
    "/api/certifications/:id/envelope",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        const [cert] = await db.select({ id: certifications.id }).from(certifications).where(certOwner(userId, certId)).limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const [el] = await db.insert(envelopeElements).values({ ...req.body, certificationId: certId }).returning();
        res.status(201).json(el);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear elemento de envolvente" });
      }
    }
  );

  app.put(
    "/api/envelope/:eid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const [el] = await db
          .update(envelopeElements)
          .set(req.body)
          .where(eq(envelopeElements.id, parseInt(req.params.eid)))
          .returning();
        res.json(el);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar elemento" });
      }
    }
  );

  app.delete(
    "/api/envelope/:eid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        await db.delete(envelopeElements).where(eq(envelopeElements.id, parseInt(req.params.eid)));
        res.json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar elemento" });
      }
    }
  );

  // ── OPENINGS ───────────────────────────────────────────────────────────────
  app.post(
    "/api/certifications/:id/openings",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        const [cert] = await db.select({ id: certifications.id }).from(certifications).where(certOwner(userId, certId)).limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const [op] = await db.insert(openings).values({ ...req.body, certificationId: certId }).returning();
        res.status(201).json(op);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear hueco" });
      }
    }
  );

  app.put(
    "/api/openings/:oid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const [op] = await db
          .update(openings)
          .set(req.body)
          .where(eq(openings.id, parseInt(req.params.oid)))
          .returning();
        res.json(op);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar hueco" });
      }
    }
  );

  app.delete(
    "/api/openings/:oid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        await db.delete(openings).where(eq(openings.id, parseInt(req.params.oid)));
        res.json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar hueco" });
      }
    }
  );

  // ── INSTALLATIONS ──────────────────────────────────────────────────────────
  app.post(
    "/api/certifications/:id/installations",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        const [cert] = await db.select({ id: certifications.id }).from(certifications).where(certOwner(userId, certId)).limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const [inst] = await db.insert(installations).values({ ...req.body, certificationId: certId }).returning();
        res.status(201).json(inst);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear instalación" });
      }
    }
  );

  app.put(
    "/api/installations/:iid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const [inst] = await db
          .update(installations)
          .set(req.body)
          .where(eq(installations.id, parseInt(req.params.iid)))
          .returning();
        res.json(inst);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar instalación" });
      }
    }
  );

  app.delete(
    "/api/installations/:iid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        await db.delete(installations).where(eq(installations.id, parseInt(req.params.iid)));
        res.json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar instalación" });
      }
    }
  );

  // ── IMPROVEMENT MEASURES ───────────────────────────────────────────────────
  app.post(
    "/api/certifications/:id/measures",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);
        const [cert] = await db.select({ id: certifications.id }).from(certifications).where(certOwner(userId, certId)).limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const [m] = await db.insert(improvementMeasures).values({ ...req.body, certificationId: certId }).returning();
        res.status(201).json(m);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al crear medida" });
      }
    }
  );

  app.put(
    "/api/measures/:mid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const [m] = await db
          .update(improvementMeasures)
          .set(req.body)
          .where(eq(improvementMeasures.id, parseInt(req.params.mid)))
          .returning();
        res.json(m);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al actualizar medida" });
      }
    }
  );

  app.delete(
    "/api/measures/:mid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        await db.delete(improvementMeasures).where(eq(improvementMeasures.id, parseInt(req.params.mid)));
        res.json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar medida" });
      }
    }
  );

  // ── VISIT PHOTOS ───────────────────────────────────────────────────────────
  app.post(
    "/api/certifications/:id/visit-photos",
    authenticate,
    visitUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const userId = (req as any).user.id;
        const certId = parseInt(req.params.id);

        if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });

        const [cert] = await db.select({ id: certifications.id }).from(certifications).where(certOwner(userId, certId)).limit(1);
        if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

        const { secure_url, public_id } = await uploadToCloudinary(req.file.buffer, {
          folder: `certifive/certs/${certId}/visit`,
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "heic", "heif", "webp"],
        });

        const { categoria = "otro", descripcion = "" } = req.body;
        const [photo] = await db
          .insert(visitPhotos)
          .values({ certificationId: certId, url: secure_url, publicId: public_id, categoria, descripcion })
          .returning();

        res.status(201).json(photo);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al subir la foto" });
      }
    }
  );

  app.delete(
    "/api/visit-photos/:pid",
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const [photo] = await db
          .select()
          .from(visitPhotos)
          .where(eq(visitPhotos.id, parseInt(req.params.pid)))
          .limit(1);
        if (!photo) return res.status(404).json({ message: "Foto no encontrada" });

        if (photo.publicId) await deleteFromCloudinary(photo.publicId, "image");
        await db.delete(visitPhotos).where(eq(visitPhotos.id, photo.id));
        res.json({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al eliminar la foto" });
      }
    }
  );
}
