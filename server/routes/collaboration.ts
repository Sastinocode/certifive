import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, or, ilike } from "drizzle-orm";
import { certifications, certificationShares, users } from "../../shared/schema";
import { authenticate } from "../auth";

export function registerCollaborationRoutes(app: Express) {

  // ── POST /api/certifications/:id/share ─────────────────────────────────────
  // Propietario invita a un técnico por email (solo lectura)
  app.post("/api/certifications/:id/share", authenticate, async (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const certId  = parseInt(req.params.id);
      const { email } = req.body as { email?: string };

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Email inválido" });
      }

      // Verificar que el cert pertenece al propietario
      const [cert] = await db.select({ id: certifications.id, ownerName: certifications.ownerName })
        .from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, ownerId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      // No puede compartir consigo mismo
      const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, ownerId)).limit(1);
      if (owner?.email?.toLowerCase() === email.toLowerCase()) {
        return res.status(400).json({ message: "No puedes compartir contigo mismo" });
      }

      // Buscar si el email corresponde a un usuario registrado
      const [collaboratorUser] = await db.select({ id: users.id })
        .from(users)
        .where(ilike(users.email, email))
        .limit(1);

      // Verificar si ya existe una invitación activa
      const existing = await db.select({ id: certificationShares.id, status: certificationShares.status })
        .from(certificationShares)
        .where(and(
          eq(certificationShares.certificationId, certId),
          ilike(certificationShares.collaboratorEmail, email),
        ))
        .limit(1);

      if (existing.length > 0 && existing[0].status !== "revoked") {
        return res.status(409).json({ message: "Este técnico ya tiene acceso a este expediente" });
      }

      // Si había una invitación revocada, actualizar en lugar de insertar
      if (existing.length > 0 && existing[0].status === "revoked") {
        const [updated] = await db.update(certificationShares)
          .set({
            status: "pending",
            collaboratorUserId: collaboratorUser?.id ?? null,
            invitedAt: new Date(),
            acceptedAt: null,
            revokedAt: null,
          })
          .where(eq(certificationShares.id, existing[0].id))
          .returning();
        return res.status(200).json({ share: updated, isRegistered: !!collaboratorUser });
      }

      // Nueva invitación
      const [share] = await db.insert(certificationShares).values({
        certificationId: certId,
        ownerUserId: ownerId,
        collaboratorEmail: email.toLowerCase(),
        collaboratorUserId: collaboratorUser?.id ?? null,
        status: collaboratorUser ? "accepted" : "pending", // si ya está registrado, acceso directo
        permission: "read",
      }).returning();

      res.status(201).json({ share, isRegistered: !!collaboratorUser });
    } catch (err) {
      console.error("[collaboration/share]", err);
      res.status(500).json({ message: "Error al compartir certificación" });
    }
  });

  // ── GET /api/certifications/:id/shares ─────────────────────────────────────
  // Propietario lista quién tiene acceso a un expediente
  app.get("/api/certifications/:id/shares", authenticate, async (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const certId  = parseInt(req.params.id);

      const [cert] = await db.select({ id: certifications.id })
        .from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, ownerId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      const shares = await db.select()
        .from(certificationShares)
        .where(and(
          eq(certificationShares.certificationId, certId),
          or(
            eq(certificationShares.status, "pending"),
            eq(certificationShares.status, "accepted"),
          ),
        ));

      res.json(shares);
    } catch (err) {
      console.error("[collaboration/list-shares]", err);
      res.status(500).json({ message: "Error al listar accesos" });
    }
  });

  // ── DELETE /api/certifications/:id/share/:shareId ──────────────────────────
  // Propietario revoca el acceso
  app.delete("/api/certifications/:id/share/:shareId", authenticate, async (req: Request, res: Response) => {
    try {
      const ownerId = req.user!.id;
      const shareId = parseInt(req.params.shareId);

      const [share] = await db.select()
        .from(certificationShares)
        .where(and(
          eq(certificationShares.id, shareId),
          eq(certificationShares.ownerUserId, ownerId),
        ))
        .limit(1);
      if (!share) return res.status(404).json({ message: "Invitación no encontrada" });

      const [revoked] = await db.update(certificationShares)
        .set({ status: "revoked", revokedAt: new Date() })
        .where(eq(certificationShares.id, shareId))
        .returning();

      res.json(revoked);
    } catch (err) {
      console.error("[collaboration/revoke]", err);
      res.status(500).json({ message: "Error al revocar acceso" });
    }
  });

  // ── GET /api/shared-with-me ────────────────────────────────────────────────
  // Técnico colaborador ve los expedientes compartidos con él
  app.get("/api/shared-with-me", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Buscar el email del usuario
      const [me] = await db.select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!me?.email) return res.json([]);

      // Shares activos (accepted o pending para este email)
      const shares = await db.select({
        shareId:   certificationShares.id,
        shareStatus: certificationShares.status,
        permission: certificationShares.permission,
        invitedAt:  certificationShares.invitedAt,
        // Datos del expediente
        certId:    certifications.id,
        ownerName: certifications.ownerName,
        address:   certifications.address,
        city:      certifications.city,
        province:  certifications.province,
        status:    certifications.status,
        energyRating: certifications.energyRating,
        createdAt: certifications.createdAt,
        // Propietario del expediente
        ownerUserId: certifications.userId,
      })
        .from(certificationShares)
        .innerJoin(certifications, eq(certificationShares.certificationId, certifications.id))
        .where(and(
          ilike(certificationShares.collaboratorEmail, me.email),
          or(
            eq(certificationShares.status, "accepted"),
            eq(certificationShares.status, "pending"),
          ),
        ));

      // Aceptar automáticamente los pending (el usuario ya está logueado = verificado)
      const pendingIds = shares.filter(s => s.shareStatus === "pending").map(s => s.shareId);
      if (pendingIds.length > 0) {
        for (const sid of pendingIds) {
          await db.update(certificationShares)
            .set({ status: "accepted", collaboratorUserId: userId, acceptedAt: new Date() })
            .where(eq(certificationShares.id, sid));
        }
      }

      res.json(shares.map(s => ({
        shareId:     s.shareId,
        permission:  s.permission,
        invitedAt:   s.invitedAt,
        certId:      s.certId,
        ownerName:   s.ownerName,
        address:     s.address,
        city:        s.city,
        province:    s.province,
        status:      s.status,
        energyRating: s.energyRating,
        createdAt:   s.createdAt,
      })));
    } catch (err) {
      console.error("[collaboration/shared-with-me]", err);
      res.status(500).json({ message: "Error al obtener expedientes compartidos" });
    }
  });

  // ── GET /api/certifications/:id/shared-view ────────────────────────────────
  // Colaborador ve el detalle completo (read-only) de un expediente compartido
  app.get("/api/certifications/:id/shared-view", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const certId = parseInt(req.params.id);

      const [me] = await db.select({ email: users.email })
        .from(users).where(eq(users.id, userId)).limit(1);
      if (!me?.email) return res.status(403).json({ message: "Sin acceso" });

      // Verificar que tiene acceso
      const [share] = await db.select({ id: certificationShares.id })
        .from(certificationShares)
        .where(and(
          eq(certificationShares.certificationId, certId),
          ilike(certificationShares.collaboratorEmail, me.email),
          eq(certificationShares.status, "accepted"),
        ))
        .limit(1);
      if (!share) return res.status(403).json({ message: "No tienes acceso a este expediente" });

      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.id, certId)).limit(1);
      if (!cert) return res.status(404).json({ message: "Expediente no encontrado" });

      res.json({ ...cert, _readOnly: true });
    } catch (err) {
      console.error("[collaboration/shared-view]", err);
      res.status(500).json({ message: "Error al obtener expediente" });
    }
  });

}
