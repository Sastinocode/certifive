// @ts-nocheck
import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  certifications,
  users,
  envelopeElements,
  openings,
  installations,
  improvementMeasures,
} from "../../shared/schema";
import { authenticate } from "../auth";

export function registerExportCE3XRoutes(app: Express) {

  app.get(
    "/api/certifications/:id/export-data",
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

        const [certifier] = await db
          .select({
            name:          users.name,
            firstName:     users.firstName,
            company:       users.company,
            licenseNumber: users.licenseNumber,
            email:         users.email,
            phone:         users.phone,
            province:      users.province,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const [envelope, openingsList, installList, measures] = await Promise.all([
          db.select().from(envelopeElements).where(eq(envelopeElements.certificationId, certId)),
          db.select().from(openings).where(eq(openings.certificationId, certId)),
          db.select().from(installations).where(eq(installations.certificationId, certId)),
          db.select().from(improvementMeasures).where(eq(improvementMeasures.certificationId, certId)),
        ]);

        res.json({
          cert,
          certifier: certifier ?? {},
          envelope,
          openings:      openingsList,
          installations: installList,
          measures,
          tecnicoFormData: cert.tecnicoFormData ?? null,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al obtener los datos de exportación" });
      }
    }
  );
}
