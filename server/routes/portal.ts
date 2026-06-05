/**
 * CERTIFIVE — Portal del cliente
 *
 * Endpoint público (sin autenticación) accesible via token único por expediente.
 * Devuelve el estado del expediente, datos del certificador, documentos
 * descargables y el historial de comunicaciones.
 *
 * GET  /api/portal/:token          — datos del portal
 * POST /api/portal/:token/generate — genera el token si no existe (autenticado)
 */

import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { certifications, users, documentos, mensajesComunicacion } from "../../shared/schema";
import { authenticate } from "../auth";
import { nanoid } from "nanoid";

// Mapa de workflowStatus a paso numérico (0-4)
const WORKFLOW_STEP: Record<string, number> = {
  nuevo:                     0,
  solicitud_enviada:         0,
  solicitud_completada:      1,
  presupuesto_enviado:       1,
  presupuesto_aceptado:      2,
  formulario_enviado:        2,
  formulario_cee_completado: 3,
  visita_completada:         3,
  finalizado:                4,
};

const STEP_LABELS = [
  "Solicitud de datos",
  "Presupuesto",
  "Formulario técnico",
  "Visita técnica",
  "Certificado listo",
];

function workflowToStep(workflowStatus: string | null, status: string): number {
  if (status === "Finalizado") return 4;
  return WORKFLOW_STEP[(workflowStatus ?? "nuevo").toLowerCase()] ?? 0;
}

export function registerPortalRoutes(app: Express) {

  // ── GET /api/portal/:token ─────────────────────────────────────────────────
  app.get("/api/portal/:token", async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
      const [cert] = await db
        .select()
        .from(certifications)
        .where(eq(certifications.clientPortalToken, token))
        .limit(1);

      if (!cert) return res.status(404).json({ message: "Enlace no válido o expirado" });

      // Certifier info (safe fields only)
      const [certifier] = await db
        .select({
          name:        users.name,
          firstName:   users.firstName,
          username:    users.username,
          phone:       users.phone,
          company:     (users as any).company,
          commercialName: (users as any).commercialName,
          logoUrl:     (users as any).logoUrl,
          email:       users.email,
        })
        .from(users)
        .where(eq(users.id, cert.userId))
        .limit(1);

      // Documents uploaded by the certifier (certificado, presupuesto)
      const docs = await db
        .select({
          id:             documentos.id,
          nombreOriginal: documentos.nombreOriginal,
          path:           documentos.path,
          tipoDoc:        documentos.tipoDoc,
          fechaSubida:    documentos.fechaSubida,
        })
        .from(documentos)
        .where(eq(documentos.certificationId, cert.id));

      // Public communications (sent messages only — not drafts)
      const mensajes = await db
        .select({
          canal:      mensajesComunicacion.canal,
          contenido:  mensajesComunicacion.contenido,
          fechaEnvio: mensajesComunicacion.fechaEnvio,
          estado:     mensajesComunicacion.estado,
        })
        .from(mensajesComunicacion)
        .where(eq(mensajesComunicacion.certificationId, cert.id));

      const currentStep = workflowToStep(cert.workflowStatus, cert.status);
      const certifierName =
        (certifier as any)?.commercialName ||
        (certifier as any)?.name ||
        (certifier as any)?.firstName ||
        certifier?.username ||
        "Tu certificador";

      res.json({
        // Expediente
        address:       cert.address,
        city:          cert.city,
        propertyType:  cert.propertyType,
        status:        cert.status,
        energyRating:  cert.energyRating,
        ownerName:     cert.ownerName,
        createdAt:     cert.createdAt,
        // Progreso
        currentStep,
        totalSteps:    4,
        stepLabels:    STEP_LABELS,
        // Certificador
        certifier: {
          name:    certifierName,
          phone:   certifier?.phone ?? null,
          email:   certifier?.email ?? null,
          company: (certifier as any)?.commercialName ?? (certifier as any)?.company ?? null,
          logoUrl: (certifier as any)?.logoUrl ?? null,
        },
        // Documentos (solo los del certificador)
        documentos: docs.filter(d => d.tipoDoc !== "otro" || d.path),
        // Comunicaciones enviadas
        mensajes: mensajes
          .filter(m => m.estado === "enviado")
          .sort((a, b) =>
            new Date(a.fechaEnvio ?? 0).getTime() - new Date(b.fechaEnvio ?? 0).getTime()
          ),
      });
    } catch (err) {
      console.error("[portal]", err);
      res.status(500).json({ message: "Error al cargar el portal" });
    }
  });

  // ── POST /api/portal/:certId/generate ─────────────────────────────────────
  // Genera (o devuelve) el token del portal para una certificación
  app.post("/api/portal/:certId/generate", authenticate, async (req: any, res: Response) => {
    const certId = parseInt(req.params.certId);
    try {
      const [cert] = await db
        .select({ id: certifications.id, userId: certifications.userId, clientPortalToken: certifications.clientPortalToken })
        .from(certifications)
        .where(eq(certifications.id, certId))
        .limit(1);

      if (!cert || cert.userId !== req.userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      // Reusar token existente o generar uno nuevo
      const token = (cert as any).clientPortalToken ?? nanoid(24);

      if (!(cert as any).clientPortalToken) {
        await db
          .update(certifications)
          .set({ clientPortalToken: token } as any)
          .where(eq(certifications.id, certId));
      }

      res.json({ token });
    } catch (err) {
      console.error("[portal/generate]", err);
      res.status(500).json({ message: "Error al generar el enlace" });
    }
  });

}
