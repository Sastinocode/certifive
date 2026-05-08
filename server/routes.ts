import { Express, Request, Response } from "express";
import { db } from "./db";
import { users, certifications, folders, pricingRates, quoteRequests, invoices, formResponses, payments } from "../shared/schema";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import Stripe from "stripe";
import {
  authenticate,
  hashPassword,
  comparePasswords,
  generateToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  createDemoUser,
  verifyToken,
} from "./auth";
import { insertUserSchema, insertCertificationSchema, insertFolderSchema, insertPricingRateSchema, documentos, payments, refreshTokens, plantillasWhatsapp, mensajesComunicacion, notificaciones, betaLeads, waitlist } from "../shared/schema";
import { encryptApiKey, validateApiKey, DEFAULT_TEMPLATES, TEMPLATE_LABELS, AVAILABLE_PLACEHOLDERS } from "./whatsapp";
import { sendNotification, retryMensaje } from "./notifications";
import { subscribe as sseSubscribe } from "./sse";
import { createNotification } from "./createNotification";
import { lt, gte } from "drizzle-orm";
import {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendFormLinkEmail,
  sendOwnerConfirmationEmail,
  sendCertifierNotification,
  sendTestEmail,
  sendSolicitudLinkEmail,
  sendNuevaSolicitudEmail,
  sendPresupuestoEmail,
  sendPresupuestoAceptadoEmail,
  sendModificacionPresupuestoEmail,
  sendPaymentLinkEmail,
  sendPagoConfirmadoEmail,
  sendPagoManualPendienteEmail,
  sendCEEFormLinkEmail,
  sendDocumentosRecibidosEmail,
  sendDocumentoRechazadoEmail,
  sendBetaLeadConfirmation,
} from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "certifive-dev-secret-2024";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// ─── Pricing helper ──────────────────────────────────────────────────────────
function calcularPrecio(
  basePrice: number,
  totalArea: number | null,
  province: string | null,
  areaTiers: any,
  provinceSurcharges: any,
): { base: number; surchargeArea: number; surchargeProvince: number; total: number } {
  let multiplier = 1;
  if (areaTiers && Array.isArray(areaTiers) && totalArea) {
    for (const tier of areaTiers) {
      if (tier.maxArea === null || totalArea <= tier.maxArea) {
        multiplier = tier.multiplier ?? 1;
        break;
      }
    }
  }
  const base = parseFloat((basePrice * multiplier).toFixed(2));
  let surchargeProvince = 0;
  if (provinceSurcharges && province) {
    const key = province.toLowerCase().replace(/\s+/g, "_");
    const pct = (provinceSurcharges as Record<string, number>)[key] ?? 0;
    surchargeProvince = parseFloat(((base * pct) / 100).toFixed(2));
  }
  const total = parseFloat((base + surchargeProvince).toFixed(2));
  return { base, surchargeArea: base - basePrice, surchargeProvince, total };
}

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// In-memory rate limiter: 5 login attempts per IP per minute
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

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

  // --- AUTH ---

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const ip = req.ip ?? "unknown";
      if (!checkLoginRateLimit(ip)) {
        return res.status(429).json({ message: "Demasiados intentos. Espera 1 minuto." });
      }

      const { username, password, rememberMe } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña requeridos" });
      }

      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Email o usuario no registrado" });
      }
      if (!user.password) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      const authUser = { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName };
      const token = generateToken(authUser, !!rememberMe);
      const refreshToken = await generateRefreshToken(user.id, !!rememberMe);

      res.json({ token, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name } });
    } catch {
      res.status(500).json({ message: "Error al iniciar sesión" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, firstName, lastName, phone, company, licenseNumber } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Usuario y contraseña requeridos" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
      }

      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "El usuario ya existe" });
      }

      const hashed = await hashPassword(password);
      const verificationToken = nanoid(32);

      const [user] = await db.insert(users).values({
        username,
        password: hashed,
        email,
        firstName,
        lastName,
        name: `${firstName || ""} ${lastName || ""}`.trim() || username,
        phone,
        company,
        licenseNumber,
        role: "user",
        emailVerificationToken: verificationToken,
      }).returning();

      const authUser = { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName };
      const token = generateToken(authUser);
      const refreshToken = await generateRefreshToken(user.id);

      // Fire-and-forget emails — never block the response
      if (user.email) {
        sendWelcomeEmail({ to: user.email, name: user.name ?? user.username, username: user.username });
        sendEmailVerification({ to: user.email, name: user.name ?? user.username, verificationToken });
      }

      res.json({ token, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name } });
    } catch {
      res.status(500).json({ message: "Error en el registro" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token requerido" });
      }

      const result = await rotateRefreshToken(refreshToken);
      if (!result) {
        return res.status(401).json({ message: "Refresh token inválido o expirado" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, result.userId)).limit(1);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      const authUser = { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName };
      const token = generateToken(authUser);

      res.json({ token, refreshToken: result.newToken });
    } catch {
      res.status(500).json({ message: "Error al renovar sesión" });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }
      res.json({ message: "Sesión cerrada" });
    } catch {
      res.status(500).json({ message: "Error al cerrar sesión" });
    }
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token de verificación requerido" });
      }

      const [user] = await db.select().from(users).where(eq(users.emailVerificationToken, token)).limit(1);
      if (!user) {
        return res.status(400).json({ message: "Token de verificación inválido o ya utilizado" });
      }

      await db.update(users)
        .set({ emailVerifiedAt: new Date(), emailVerificationToken: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));

      res.json({ message: "Email verificado correctamente" });
    } catch {
      res.status(500).json({ message: "Error al verificar email" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requerido" });

    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user?.email) {
        // Stateless reset token — signed JWT, 1 h expiry, no DB needed
        const resetToken = jwt.sign(
          { id: user.id, purpose: "password_reset" },
          JWT_SECRET,
          { expiresIn: "1h" },
        );
        sendPasswordResetEmail({ to: user.email, name: user.name ?? user.username, resetToken });
      }
    } catch {
      // Swallow errors intentionally — never reveal whether email exists
    }

    // Always same response (prevents email enumeration)
    res.json({ message: "Si ese email está registrado, recibirás un enlace para restablecer tu contraseña." });
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) return res.status(400).json({ message: "Token y nueva contraseña requeridos" });
      if (newPassword.length < 8) return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });

      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload?.purpose !== "password_reset") return res.status(400).json({ message: "Token inválido" });

      const hashed = await hashPassword(newPassword);
      await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, payload.id));

      res.json({ message: "Contraseña actualizada correctamente" });
    } catch {
      res.status(400).json({ message: "Token inválido o expirado" });
    }
  });

  app.post("/api/auth/demo", async (_req: Request, res: Response) => {
    try {
      const demo = await createDemoUser();
      const token = generateToken(demo);
      const refreshToken = await generateRefreshToken(demo.id);
      res.json({ token, refreshToken, user: demo });
    } catch {
      res.status(500).json({ message: "Error al acceder a la demo" });
    }
  });

  app.get("/api/auth/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
      const { password: _, emailVerificationToken: __, whatsappApiKey: ___, ...safeUser } = user as any;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  app.put("/api/auth/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const {
        firstName, lastName, email, phone, company, commercialName,
        licenseNumber, dniNif, address, city, postalCode, province,
        iban, emailSignature,
      } = req.body;
      const name = `${firstName || ""} ${lastName || ""}`.trim();
      const [updated] = await db.update(users)
        .set({
          firstName, lastName, name, email, phone,
          company, commercialName, licenseNumber, dniNif,
          address, city, postalCode, province, iban,
          emailSignature,
          updatedAt: new Date(),
        } as any)
        .where(eq(users.id, userId))
        .returning();
      const { password: _, emailVerificationToken: __, whatsappApiKey: ___, ...safeUser } = updated;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Error al actualizar usuario" });
    }
  });

  // ─── Profile: logo upload ──────────────────────────────────────────────────
  const avatarUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = "uploads/avatars";
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, nanoid(12) + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = [".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase());
      cb(null, ok);
    },
  });

  app.post("/api/auth/user/logo", authenticate, avatarUpload.single("logo"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Archivo inválido (máx 2 MB, PNG/JPG)" });
    const url = `/api/uploads/avatars/${req.file.filename}`;
    await db.update(users).set({ logoUrl: url, updatedAt: new Date() } as any).where(eq(users.id, req.userId));
    res.json({ url });
  });

  app.post("/api/auth/user/firma", authenticate, avatarUpload.single("firma"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ message: "Archivo inválido (máx 2 MB, PNG/JPG)" });
    const url = `/api/uploads/avatars/${req.file.filename}`;
    await db.update(users).set({ firmaUrl: url, updatedAt: new Date() } as any).where(eq(users.id, req.userId));
    res.json({ url });
  });

  app.get("/api/uploads/avatars/:filename", (req, res) => {
    const fp = path.resolve(`uploads/avatars/${req.params.filename}`);
    if (!fs.existsSync(fp)) return res.status(404).end();
    res.sendFile(fp);
  });

  // ─── Profile completeness ──────────────────────────────────────────────────
  // PATCH /api/auth/onboarding/complete — mark onboarding as done
  app.patch("/api/auth/onboarding/complete", authenticate, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
      await db
        .update(users)
        .set({ onboardingCompleted: true, onboardingCompletedAt: new Date(), updatedAt: new Date() } as any)
        .where(eq(users.id, userId));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al completar onboarding" });
    }
  });

  app.get("/api/auth/user/completeness", authenticate, async (req: any, res) => {
    try {
      const [u] = await db.select().from(users).where(eq(users.id, req.userId));
      if (!u) return res.status(404).end();
      const checks = [
        { label: "Nombre y apellidos", filled: !!((u as any).firstName && (u as any).lastName) },
        { label: "Email de contacto",  filled: !!(u as any).email },
        { label: "Teléfono",           filled: !!(u as any).phone },
        { label: "DNI / NIF",          filled: !!(u as any).dniNif },
        { label: "Dirección fiscal",   filled: !!(u as any).address },
        { label: "Empresa / Nombre",   filled: !!(u as any).company },
        { label: "Nº de habilitación", filled: !!(u as any).licenseNumber },
        { label: "Logo profesional",   filled: !!(u as any).logoUrl },
      ];
      const filled  = checks.filter(c => c.filled).length;
      const percent = Math.round((filled / checks.length) * 100);
      res.json({ percent, missing: checks.filter(c => !c.filled).map(c => c.label), complete: percent === 100 });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // ─── Notifications preferences ─────────────────────────────────────────────
  app.put("/api/auth/user/notifications", authenticate, async (req: any, res) => {
    try {
      const { notifyFormCompleted, notifyPaymentReceived, notifyNewMessage, dailyDigestEnabled, dailyDigestHour } = req.body;
      const [updated] = await db.update(users).set({
        notifyFormCompleted:  !!notifyFormCompleted,
        notifyPaymentReceived: !!notifyPaymentReceived,
        notifyNewMessage:     !!notifyNewMessage,
        dailyDigestEnabled:   !!dailyDigestEnabled,
        dailyDigestHour:      dailyDigestHour ?? 8,
        updatedAt: new Date(),
      } as any).where(eq(users.id, req.userId)).returning();
      const { password: _, emailVerificationToken: __, whatsappApiKey: ___, ...safe } = updated;
      res.json(safe);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // ─── Security: change password + timezone ──────────────────────────────────
  app.put("/api/auth/user/security", authenticate, async (req: any, res) => {
    try {
      const { currentPassword, newPassword, timezone } = req.body;
      const [u] = await db.select().from(users).where(eq(users.id, req.userId));
      if (!u) return res.status(404).end();

      if (currentPassword && newPassword) {
        if (!u.password) return res.status(400).json({ message: "No tienes contraseña configurada" });
        const ok = await comparePasswords(currentPassword, u.password);
        if (!ok) return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        if (newPassword.length < 8) return res.status(400).json({ message: "La nueva contraseña debe tener al menos 8 caracteres" });
        const hashed = await hashPassword(newPassword);
        await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, req.userId));
      }

      if (timezone) {
        await db.update(users).set({ timezone: timezone as any, updatedAt: new Date() }).where(eq(users.id, req.userId));
      }

      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // ─── GDPR data export ──────────────────────────────────────────────────────
  app.get("/api/auth/user/export", authenticate, async (req: any, res) => {
    try {
      const [u] = await db.select().from(users).where(eq(users.id, req.userId));
      if (!u) return res.status(404).end();
      const certs  = await db.select().from(certifications).where(eq(certifications.userId, req.userId));
      const fldrs  = await db.select().from(folders).where(eq(folders.userId, req.userId));
      const { password: _, whatsappApiKey: __, emailVerificationToken: ___, ...safeUser } = u;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="certifive-${new Date().toISOString().slice(0, 10)}.json"`);
      res.json({ exportedAt: new Date().toISOString(), user: safeUser, certifications: certs, folders: fldrs });
    } catch { res.status(500).json({ message: "Error" }); }
  });

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

  // --- PRICING ---

  app.get("/api/pricing", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(pricingRates).where(eq(pricingRates.userId, userId));
      res.json(result);
    } catch {
      res.status(500).json({ message: "Error al obtener tarifas" });
    }
  });

  app.post("/api/pricing", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [rate] = await db.insert(pricingRates).values({ ...req.body, userId }).returning();
      res.status(201).json(rate);
    } catch {
      res.status(500).json({ message: "Error al crear tarifa" });
    }
  });

  app.put("/api/pricing/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [rate] = await db.update(pricingRates)
        .set(req.body)
        .where(and(eq(pricingRates.id, parseInt(req.params.id)), eq(pricingRates.userId, userId)))
        .returning();
      res.json(rate);
    } catch {
      res.status(500).json({ message: "Error al actualizar tarifa" });
    }
  });

  app.delete("/api/pricing/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await db.delete(pricingRates).where(and(eq(pricingRates.id, parseInt(req.params.id)), eq(pricingRates.userId, userId)));
      res.json({ message: "Eliminada" });
    } catch {
      res.status(500).json({ message: "Error al eliminar tarifa" });
    }
  });

  // --- INVOICES ---

  // Helper to map DB invoice row → frontend Invoice shape
  const mapInvoice = (i: any) => ({
    ...i,
    // Field aliases expected by the frontend
    total: i.totalAmount ?? i.total ?? "0",
    subtotal: i.amount ?? "0",
    vatRate: i.taxRate ?? "21",
    vatAmount: i.tax ?? "0",
    paymentStatus: i.status ?? "pending",
    issueDate: i.issuedAt ? new Date(i.issuedAt).toISOString().split("T")[0] : (i.issueDate ?? new Date().toISOString().split("T")[0]),
    dueDate: i.dueDate ? (typeof i.dueDate === "string" ? i.dueDate.split("T")[0] : new Date(i.dueDate).toISOString().split("T")[0]) : undefined,
    paidDate: i.paidAt ? new Date(i.paidAt).toISOString().split("T")[0] : undefined,
    description: i.notes ?? i.description ?? "",
    clientNif: i.clientDni ?? i.clientNif ?? "",
    series: i.series ?? "A",
    isProforma: i.isProforma ?? false,
    invoiceType: i.invoiceType ?? "factura",
    isAccountingRegistered: i.isAccountingRegistered ?? true,
    manualAccountingRequired: i.manualAccountingRequired ?? false,
  });

  app.get("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
      res.json(result.map(mapInvoice));
    } catch {
      res.status(500).json({ message: "Error al obtener facturas" });
    }
  });

  app.post("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const year = new Date().getFullYear();
      const countResult = await db.select().from(invoices).where(eq(invoices.userId, userId));
      const seq = String(countResult.length + 1).padStart(4, "0");
      const invoiceNumber = `${req.body.series ?? "A"}${year}-${seq}`;
      const dbPayload = {
        userId,
        invoiceNumber,
        clientName: req.body.clientName,
        clientEmail: req.body.clientEmail,
        clientDni: req.body.clientNif ?? req.body.clientDni,
        clientAddress: req.body.clientAddress,
        amount: req.body.subtotal ?? req.body.amount ?? "0",
        taxRate: req.body.vatRate ?? "21",
        tax: req.body.vatAmount ?? "0",
        totalAmount: req.body.total ?? req.body.totalAmount ?? "0",
        status: req.body.paymentStatus ?? req.body.status ?? "issued",
        notes: req.body.description ?? req.body.notes,
        issuedAt: new Date(),
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };
      const [inv] = await db.insert(invoices).values(dbPayload).returning();
      res.status(201).json(mapInvoice(inv));
    } catch (e: any) {
      res.status(500).json({ message: "Error al crear factura", detail: e?.message });
    }
  });

  app.put("/api/invoices/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      const dbPayload: any = { updatedAt: new Date() };
      if (req.body.clientName !== undefined) dbPayload.clientName = req.body.clientName;
      if (req.body.clientEmail !== undefined) dbPayload.clientEmail = req.body.clientEmail;
      if (req.body.clientNif !== undefined) dbPayload.clientDni = req.body.clientNif;
      if (req.body.subtotal !== undefined) dbPayload.amount = req.body.subtotal;
      if (req.body.vatRate !== undefined) dbPayload.taxRate = req.body.vatRate;
      if (req.body.vatAmount !== undefined) dbPayload.tax = req.body.vatAmount;
      if (req.body.total !== undefined) dbPayload.totalAmount = req.body.total;
      if (req.body.paymentStatus !== undefined) dbPayload.status = req.body.paymentStatus;
      if (req.body.description !== undefined) dbPayload.notes = req.body.description;
      if (req.body.dueDate !== undefined) dbPayload.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
      if (req.body.paymentStatus === "paid") dbPayload.paidAt = new Date();
      const [inv] = await db.update(invoices)
        .set(dbPayload)
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .returning();
      if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
      res.json(mapInvoice(inv));
    } catch {
      res.status(500).json({ message: "Error al actualizar factura" });
    }
  });

  // Invoice actions (stubs + implemented)
  app.post("/api/invoices/:id/register-accounting", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      const [inv] = await db.update(invoices)
        .set({ updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .returning();
      if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
      res.json({ success: true, message: "Factura registrada en contabilidad" });
    } catch {
      res.status(500).json({ message: "Error al registrar en contabilidad" });
    }
  });

  app.post("/api/invoices/:id/convert-to-invoice", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      const [inv] = await db.update(invoices)
        .set({ status: "issued", updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
        .returning();
      if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
      res.json(mapInvoice(inv));
    } catch {
      res.status(500).json({ message: "Error al convertir factura" });
    }
  });

  app.post("/api/invoices/:id/generate-pdf", authenticate, async (_req: Request, res: Response) => {
    res.json({ success: true, message: "PDF generado (funcionalidad próximamente disponible)" });
  });

  app.post("/api/invoices/:id/send", authenticate, async (_req: Request, res: Response) => {
    res.json({ success: true, message: "Factura enviada" });
  });

  // Export endpoints
  app.post("/api/export/:type", authenticate, async (req: Request, res: Response) => {
    res.json({ success: true, message: `Exportación de ${req.params.type} completada (funcionalidad próximamente disponible)` });
  });

  app.get("/api/financial/summary", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const toNum = (v: any) => parseFloat(v ?? "0") || 0;

      const totalInvoiced = allInvoices.reduce((s, i) => s + toNum(i.totalAmount), 0);
      const totalPaid = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + toNum(i.totalAmount), 0);
      const totalPending = allInvoices.filter(i => i.status === "issued").reduce((s, i) => s + toNum(i.totalAmount), 0);
      const totalOverdue = allInvoices.filter(i => i.status === "overdue" || (i.status === "issued" && i.dueDate && new Date(i.dueDate) < now)).reduce((s, i) => s + toNum(i.totalAmount), 0);

      const currentMonthRevenue = allInvoices.filter(i => i.paidAt && new Date(i.paidAt) >= startOfMonth).reduce((s, i) => s + toNum(i.totalAmount), 0);
      const previousMonthRevenue = allInvoices.filter(i => i.paidAt && new Date(i.paidAt) >= startOfLastMonth && new Date(i.paidAt) <= endOfLastMonth).reduce((s, i) => s + toNum(i.totalAmount), 0);
      const revenueGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      res.json({ totalInvoiced, totalPaid, totalPending, totalOverdue, totalCollections: totalPaid, netIncome: totalPaid, currentMonthRevenue, previousMonthRevenue, revenueGrowth });
    } catch {
      res.status(500).json({ message: "Error al obtener resumen financiero" });
    }
  });

  // Helper to map DB payment row → frontend Payment shape
  const mapPayment = (p: any) => ({
    ...p,
    paymentMethod: p.metodo ?? p.paymentMethod ?? "other",
    paymentDate: p.paidAt
      ? new Date(p.paidAt).toISOString().split("T")[0]
      : new Date(p.createdAt).toISOString().split("T")[0],
    paymentReference: p.stripePaymentIntentId ?? p.paymentReference ?? undefined,
    status: p.estadoConfirmacion === "confirmado" ? "confirmed" : (p.status === "succeeded" ? "confirmed" : p.status ?? "pending"),
  });

  // Helper to map a payment into a Collection shape for the frontend
  const mapPaymentToCollection = (p: any) => ({
    id: p.id,
    userId: String(p.userId),
    amount: p.amount?.toString() ?? "0",
    concept: p.description ?? p.notas ?? "Cobro manual",
    paymentMethod: p.metodo ?? "cash",
    paymentReference: p.stripePaymentIntentId ?? undefined,
    collectionDate: p.paidAt
      ? new Date(p.paidAt).toISOString().split("T")[0]
      : new Date(p.createdAt).toISOString().split("T")[0],
    invoiceId: p.invoiceId ?? undefined,
    isInvoicePayment: !!p.invoiceId,
    clientName: p.clientName ?? undefined,
    clientEmail: undefined,
    clientPhone: undefined,
    vatIncluded: false,
    vatAmount: "0",
    vatRate: "21",
    status: p.estadoConfirmacion === "confirmado" || p.status === "succeeded" ? "confirmed" : "pending",
    notes: p.notas ?? undefined,
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
  });

  app.get("/api/payments", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
      res.json(result.map(mapPayment));
    } catch {
      res.status(500).json({ message: "Error al obtener pagos" });
    }
  });

  app.post("/api/payments", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [pay] = await db.insert(payments).values({
        userId,
        amount: req.body.amount?.toString() ?? "0",
        metodo: req.body.paymentMethod ?? req.body.metodo,
        invoiceId: req.body.invoiceId ?? undefined,
        notas: req.body.notas ?? undefined,
        status: "succeeded",
        estadoConfirmacion: "confirmado",
        paidAt: new Date(),
      }).returning();
      res.status(201).json(mapPayment(pay));
    } catch {
      res.status(500).json({ message: "Error al registrar pago" });
    }
  });

  // Collections: stored as payments with manual methods, no invoiceId
  app.get("/api/collections", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(payments)
        .where(and(
          eq(payments.userId, userId),
          eq(payments.estadoConfirmacion, "confirmado"),
        ))
        .orderBy(desc(payments.createdAt));
      res.json(result.map(mapPaymentToCollection));
    } catch {
      res.status(500).json({ message: "Error al obtener cobros" });
    }
  });

  app.post("/api/collections", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [pay] = await db.insert(payments).values({
        userId,
        amount: req.body.amount?.toString() ?? "0",
        metodo: req.body.paymentMethod ?? "cash",
        description: req.body.concept,
        notas: req.body.notes,
        status: "succeeded",
        estadoConfirmacion: "confirmado",
        paidAt: req.body.collectionDate ? new Date(req.body.collectionDate) : new Date(),
      }).returning();
      res.status(201).json(mapPaymentToCollection(pay));
    } catch {
      res.status(500).json({ message: "Error al registrar cobro" });
    }
  });

  app.delete("/api/collections/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const id = parseInt(req.params.id);
      await db.delete(payments).where(and(eq(payments.id, id), eq(payments.userId, userId)));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "Error al eliminar cobro" });
    }
  });

  app.post("/api/collections/:id/create-invoice", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const paymentId = parseInt(req.params.id);
      const [payment] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.userId, userId)));
      if (!payment) return res.status(404).json({ message: "Cobro no encontrado" });
      const year = new Date().getFullYear();
      const countResult = await db.select().from(invoices).where(eq(invoices.userId, userId));
      const seq = String(countResult.length + 1).padStart(4, "0");
      const invoiceNumber = `A${year}-${seq}`;
      const [inv] = await db.insert(invoices).values({
        userId,
        invoiceNumber,
        amount: payment.amount,
        totalAmount: payment.amount,
        taxRate: "21",
        tax: "0",
        status: "paid",
        notes: payment.description ?? payment.notas ?? "Cobro en efectivo",
        issuedAt: new Date(),
        paidAt: payment.paidAt ?? new Date(),
      }).returning();
      await db.update(payments).set({ invoiceId: inv.id }).where(eq(payments.id, paymentId));
      res.status(201).json(mapInvoice(inv));
    } catch {
      res.status(500).json({ message: "Error al crear factura del cobro" });
    }
  });

  // ─── WAITLIST ────────────────────────────────────────────────────────────────

  // Ensure waitlist table exists (auto-create on first run)
  db.execute(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT,
      phone TEXT,
      module TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS waitlist_module_idx ON waitlist (module);
  `).catch(() => {});

  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const { email, phone, module: mod } = req.body;
      if (!mod) return res.status(400).json({ message: "El campo 'module' es obligatorio" });
      if (!email && !phone) return res.status(400).json({ message: "Introduce un email o teléfono" });
      await db.insert(waitlist).values({ email: email?.trim() || null, phone: phone?.trim() || null, module: mod });
      const [{ count }] = await db.execute(`SELECT COUNT(*)::int AS count FROM waitlist WHERE module = '${mod.replace(/'/g, "''")}'`) as any;
      res.status(201).json({ success: true, count: Number(count) });
    } catch (e: any) {
      res.status(500).json({ message: "Error al guardar el registro", detail: e?.message });
    }
  });

  app.get("/api/waitlist/count/:module", async (req: Request, res: Response) => {
    try {
      const mod = req.params.module;
      const result = await db.execute(`SELECT COUNT(*)::int AS count FROM waitlist WHERE module = '${mod.replace(/'/g, "''")}'`) as any;
      const count = Number(result[0]?.count ?? result?.rows?.[0]?.count ?? 0);
      res.json({ count });
    } catch {
      res.json({ count: 0 });
    }
  });

  // Legacy stub (kept for backwards compat)
  app.post("/api/notify-waitlist", async (req: Request, res: Response) => {
    res.json({ success: true, message: "Email registrado en lista de espera" });
  });

  app.get("/api/manager/financial-records", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
      const allPayments = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
      const records = [
        ...allInvoices.map(i => ({ type: "invoice", ...mapInvoice(i), paymentDate: i.paidAt ? new Date(i.paidAt).toISOString().split("T")[0] : undefined, collectionDate: i.issuedAt ? new Date(i.issuedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0] })),
        ...allPayments.map(p => ({ type: "collection", ...mapPaymentToCollection(p) })),
      ].sort((a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0).getTime() - new Date(a.createdAt ?? a.updatedAt ?? 0).getTime());
      res.json(records);
    } catch {
      res.status(500).json({ message: "Error al obtener registros financieros" });
    }
  });

  // --- STATS ---

  app.get("/api/stats", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const allCerts = await db.select().from(certifications).where(eq(certifications.userId, userId));
      const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
      const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));

      res.json({
        totalCertifications: allCerts.length,
        activeCertifications: allCerts.filter(c => !c.isArchived).length,
        archivedCertifications: allCerts.filter(c => c.isArchived).length,
        totalFolders: allFolders.length,
        totalInvoices: allInvoices.length,
        byStatus: {
          Nuevo: allCerts.filter(c => c.status === "Nuevo").length,
          "En Proceso": allCerts.filter(c => c.status === "En Proceso").length,
          Finalizado: allCerts.filter(c => c.status === "Finalizado").length,
        },
      });
    } catch {
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // --- PUBLIC FORM (no auth required) ---

  // Generate a shareable link for a certification
  app.post("/api/certifications/:id/generate-link", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);

      const [cert] = await db.select().from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      // Reuse existing token or create a new one
      const token = cert.formToken ?? nanoid(32);
      const [updated] = await db.update(certifications)
        .set({
          formToken: token,
          formStatus: cert.formStatus ?? "enviado",
          formSentAt: cert.formSentAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, certId))
        .returning();

      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const url = `${protocol}://${host}/form/${token}`;

      // Send form-link email to owner if we have their email address
      const ownerEmail = cert.ownerEmail ?? req.body.ownerEmail ?? null;
      if (ownerEmail) {
        const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        sendFormLinkEmail({
          to: ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          certifierPhone: certifier?.phone ?? null,
          certifierCompany: certifier?.company ?? null,
          formUrl: url,
          propertyAddress: cert.address ? `${cert.address}, ${cert.city ?? ""}`.trim().replace(/,$/, "") : null,
        });
      }

      res.json({ token, url, formStatus: updated.formStatus, emailSent: !!ownerEmail });
    } catch {
      res.status(500).json({ message: "Error al generar el enlace" });
    }
  });

  // Public: load form data (no auth)
  app.get("/api/form/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.formToken, token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado o enlace inválido" });

      if (cert.formStatus === "completado") {
        return res.json({ alreadyCompleted: true });
      }

      const [certifier] = await db.select({
        name: users.name,
        firstName: users.firstName,
        company: users.company,
      }).from(users).where(eq(users.id, cert.userId!)).limit(1);

      res.json({
        alreadyCompleted: false,
        certifier: {
          name: certifier?.name ?? certifier?.firstName ?? "Tu certificador",
          company: certifier?.company ?? null,
        },
        // Pre-fill known data so the owner only fills what's missing
        prefill: {
          ownerName: cert.ownerName ?? "",
          ownerEmail: cert.ownerEmail ?? "",
          ownerPhone: cert.ownerPhone ?? "",
          ownerDni: cert.ownerDni ?? "",
          address: cert.address ?? "",
          city: cert.city ?? "",
          postalCode: cert.postalCode ?? "",
          province: cert.province ?? "",
          propertyType: cert.propertyType ?? "",
          constructionYear: cert.constructionYear ?? "",
          totalArea: cert.totalArea ?? "",
          cadastralReference: cert.cadastralReference ?? "",
        },
      });
    } catch {
      res.status(500).json({ message: "Error al cargar el formulario" });
    }
  });

  // Public: mark form as opened
  app.post("/api/form/:token/open", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.formToken, token))
        .limit(1);
      if (!cert || cert.formStatus === "completado") return res.json({ ok: true });

      // Only update if not already opened/completed
      if (cert.formStatus === "enviado") {
        await db.update(certifications)
          .set({ formStatus: "abierto", formOpenedAt: new Date(), updatedAt: new Date() })
          .where(eq(certifications.id, cert.id));
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true }); // Never fail silently on open-tracking
    }
  });

  // Public: submit form data
  app.post("/api/form/:token/submit", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.formToken, token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
      if (cert.formStatus === "completado") {
        return res.status(409).json({ message: "Este formulario ya fue enviado" });
      }

      const {
        ownerName, ownerEmail, ownerPhone, ownerDni,
        address, city, postalCode, province,
        propertyType, constructionYear, totalArea, cadastralReference,
        energyData,
      } = req.body;

      // Update certification with owner-submitted data
      await db.update(certifications)
        .set({
          ownerName: ownerName || cert.ownerName,
          ownerEmail: ownerEmail || cert.ownerEmail,
          ownerPhone: ownerPhone || cert.ownerPhone,
          ownerDni: ownerDni || cert.ownerDni,
          address: address || cert.address,
          city: city || cert.city,
          postalCode: postalCode || cert.postalCode,
          province: province || cert.province,
          propertyType: propertyType || cert.propertyType,
          constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
          totalArea: totalArea || cert.totalArea,
          cadastralReference: cadastralReference || cert.cadastralReference,
          formData: { ...(cert.formData as object ?? {}), energyData },
          formStatus: "completado",
          formCompletedAt: new Date(),
          status: "En Proceso",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, cert.id));

      // Emails: owner confirmation + certifier notification (fire-and-forget)
      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      const finalOwnerEmail = ownerEmail || cert.ownerEmail;
      const finalOwnerName  = ownerName  || cert.ownerName  || "Propietario";
      const finalAddress    = address    || cert.address;
      const certifierName   = certifier?.name ?? certifier?.username ?? "Tu certificador";

      if (finalOwnerEmail) {
        sendOwnerConfirmationEmail({
          to: finalOwnerEmail,
          ownerName: finalOwnerName,
          certifierName,
          certifierPhone: certifier?.phone ?? null,
          certifierEmail: certifier?.email ?? null,
          propertyAddress: finalAddress ?? null,
        });
      }
      if (certifier?.email) {
        sendCertifierNotification({
          to: certifier.email,
          certifierName,
          ownerName: finalOwnerName,
          ownerPhone: ownerPhone || cert.ownerPhone || null,
          ownerEmail: finalOwnerEmail ?? null,
          propertyAddress: finalAddress ?? null,
          certificationId: cert.id,
        });
      }

      // Store immutable snapshot in form_responses for audit trail
      await db.insert(formResponses).values({
        certificationId: cert.id,
        ownerName: ownerName || null,
        ownerEmail: ownerEmail || null,
        ownerPhone: ownerPhone || null,
        ownerDni: ownerDni || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        province: province || null,
        propertyType: propertyType || null,
        constructionYear: constructionYear ? parseInt(constructionYear) : null,
        totalArea: totalArea || null,
        cadastralReference: cadastralReference || null,
        energyData: energyData ?? null,
        rawData: req.body,
      });

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al enviar el formulario" });
    }
  });

  // --- TEST EMAIL (authenticated — remove before public launch) ---

  app.post("/api/test-email", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const to = req.body.email || user?.email;
      if (!to) return res.status(400).json({ message: "No hay dirección de email configurada en tu cuenta" });
      await sendTestEmail(to);
      res.json({ message: `Email de prueba enviado a ${to}` });
    } catch {
      res.status(500).json({ message: "Error al enviar email de prueba" });
    }
  });

  // --- UPLOAD ---

  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
  app.post("/api/upload", authenticate, upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });
    res.json({ filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // USER SETTINGS (payment + service)
  // ─────────────────────────────────────────────────────────────────────────

  app.put("/api/auth/user/settings", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const {
        publicSlug, condicionesServicio, plazoEntregaDias,
        bizumPhone, iban, enabledPaymentMethods,
        tramo1Percent, blockFormUntilPayment1, blockCertificateUntilPayment2, paymentReminderDays,
        invoiceSeriesPrefix, invoiceNextNumber, ivaPercent,
      } = req.body;

      // Validate slug uniqueness if provided
      if (publicSlug) {
        const [existing] = await db.select({ id: users.id })
          .from(users)
          .where(and(eq(users.publicSlug, publicSlug), eq(users.id, userId).not ? undefined as any : undefined))
          .limit(1);
        // Simple check: if another user has this slug, reject
        const [conflicting] = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.publicSlug, publicSlug))
          .limit(1);
        if (conflicting && conflicting.id !== userId) {
          return res.status(409).json({ message: "Ese slug ya está en uso. Elige otro." });
        }
      }

      const [updated] = await db.update(users)
        .set({
          publicSlug: publicSlug || null,
          condicionesServicio: condicionesServicio || null,
          plazoEntregaDias: plazoEntregaDias ?? 10,
          bizumPhone: bizumPhone || null,
          iban: iban || null,
          enabledPaymentMethods: enabledPaymentMethods ?? null,
          tramo1Percent: tramo1Percent ?? 25,
          blockFormUntilPayment1: !!blockFormUntilPayment1,
          blockCertificateUntilPayment2: !!blockCertificateUntilPayment2,
          paymentReminderDays: paymentReminderDays ?? 3,
          invoiceSeriesPrefix: invoiceSeriesPrefix || "FAC",
          invoiceNextNumber: invoiceNextNumber ?? 1,
          ivaPercent: ivaPercent ?? "21",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      const { password: _, emailVerificationToken: __, ...safe } = updated;
      res.json(safe);
    } catch {
      res.status(500).json({ message: "Error al guardar configuración" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC CERTIFIER LANDING  GET /api/c/:slug
  // ─────────────────────────────────────────────────────────────────────────

  app.get("/api/c/:slug", async (req: Request, res: Response) => {
    try {
      const [certifier] = await db.select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        company: users.company,
        licenseNumber: users.licenseNumber,
        phone: users.phone,
        email: users.email,
        province: users.province,
        city: users.city,
        condicionesServicio: users.condicionesServicio,
        plazoEntregaDias: users.plazoEntregaDias,
        publicSlug: users.publicSlug,
      }).from(users).where(eq(users.publicSlug, req.params.slug)).limit(1);

      if (!certifier) return res.status(404).json({ message: "Certificador no encontrado" });
      res.json(certifier);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PRICING CALCULATE  POST /api/pricing/calculate
  // ─────────────────────────────────────────────────────────────────────────

  app.post("/api/pricing/calculate", async (req: Request, res: Response) => {
    try {
      const { certifierId, propertyType, totalArea, province } = req.body;
      if (!certifierId || !propertyType) {
        return res.status(400).json({ message: "certifierId y propertyType son obligatorios" });
      }

      const [rate] = await db.select().from(pricingRates)
        .where(and(
          eq(pricingRates.userId, parseInt(certifierId)),
          eq(pricingRates.propertyType, propertyType),
          eq(pricingRates.isActive, true),
        ))
        .limit(1);

      if (!rate) {
        return res.json({ available: false, message: "No hay tarifa configurada para este tipo de inmueble" });
      }

      const pricing = calcularPrecio(
        parseFloat(rate.basePrice as any),
        totalArea ? parseFloat(totalArea) : null,
        province ?? null,
        rate.areaTiers,
        rate.provinceSurcharges,
      );

      res.json({ available: true, ...pricing });
    } catch {
      res.status(500).json({ message: "Error al calcular precio" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SOLICITUD FLOW  (Formulario 1 — tasación)
  // ─────────────────────────────────────────────────────────────────────────

  // Certifier generates solicitud token and sends link
  app.post("/api/certifications/:id/generate-solicitud", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);

      const [cert] = await db.select().from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      const token = cert.solicitudToken ?? nanoid(32);
      const [updated] = await db.update(certifications)
        .set({
          solicitudToken: token,
          solicitudStatus: cert.solicitudStatus ?? "enviado",
          solicitudSentAt: cert.solicitudSentAt ?? new Date(),
          workflowStatus: "solicitud_enviada",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, certId))
        .returning();

      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const url = `${protocol}://${host}/solicitud/${token}`;

      const ownerEmail = cert.ownerEmail ?? req.body.ownerEmail ?? null;
      if (ownerEmail) {
        const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        sendSolicitudLinkEmail({
          to: ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          certifierPhone: certifier?.phone ?? null,
          certifierCompany: certifier?.company ?? null,
          solicitudUrl: url,
          propertyAddress: cert.address ? `${cert.address}, ${cert.city ?? ""}`.trimEnd().replace(/,$/, "") : null,
        });
      }

      res.json({ token, url, solicitudStatus: updated.solicitudStatus, emailSent: !!ownerEmail });
    } catch {
      res.status(500).json({ message: "Error al generar el enlace de solicitud" });
    }
  });

  // Public: Vía B — owner fills solicitud from certifier's public page (no existing cert)
  app.post("/api/solicitud/nueva", async (req: Request, res: Response) => {
    try {
      const { certifierId, ownerName, ownerEmail, ownerPhone, ownerDni } = req.body;
      if (!certifierId || !ownerName) {
        return res.status(400).json({ message: "certifierId y nombre son obligatorios" });
      }

      const token = nanoid(32);
      const [cert] = await db.insert(certifications).values({
        userId: parseInt(certifierId),
        ownerName,
        ownerEmail: ownerEmail || null,
        ownerPhone: ownerPhone || null,
        ownerDni: ownerDni || null,
        solicitudToken: token,
        solicitudStatus: "abierto",
        solicitudSentAt: new Date(),
        solicitudOpenedAt: new Date(),
        workflowStatus: "solicitud_enviada",
        status: "Nuevo",
      }).returning();

      // Notify certifier
      const [certifier] = await db.select().from(users).where(eq(users.id, parseInt(certifierId))).limit(1);
      if (certifier?.email) {
        sendNuevaSolicitudEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName,
          ownerPhone: ownerPhone || null,
          ownerEmail: ownerEmail || null,
          propertyAddress: null,
          certificationId: cert.id,
        });
      }

      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const url = `${protocol}://${host}/solicitud/${token}`;
      res.json({ token, url, certificationId: cert.id });
    } catch {
      res.status(500).json({ message: "Error al crear solicitud" });
    }
  });

  // Public: get solicitud form data
  app.get("/api/solicitud/:token", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.solicitudToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Enlace inválido o expirado" });

      const [certifier] = await db.select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        company: users.company,
        phone: users.phone,
        plazoEntregaDias: users.plazoEntregaDias,
      }).from(users).where(eq(users.id, cert.userId!)).limit(1);

      const completed = cert.solicitudStatus === "completado";
      res.json({
        completed,
        certifier: {
          id: certifier?.id,
          name: certifier?.name ?? certifier?.firstName ?? "Tu certificador",
          company: certifier?.company ?? null,
          phone: certifier?.phone ?? null,
          plazoEntregaDias: certifier?.plazoEntregaDias ?? 10,
        },
        prefill: {
          ownerName: cert.ownerName ?? "",
          ownerEmail: cert.ownerEmail ?? "",
          ownerPhone: cert.ownerPhone ?? "",
          ownerDni: cert.ownerDni ?? "",
          address: cert.address ?? "",
          city: cert.city ?? "",
          postalCode: cert.postalCode ?? "",
          province: cert.province ?? "",
          propertyType: cert.propertyType ?? "",
          constructionYear: cert.constructionYear ?? "",
          totalArea: cert.totalArea ?? "",
          numPlantas: cert.numPlantas ?? "",
          cadastralReference: cert.cadastralReference ?? "",
        },
      });
    } catch {
      res.status(500).json({ message: "Error al cargar formulario" });
    }
  });

  // Public: mark solicitud opened
  app.post("/api/solicitud/:token/open", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.solicitudToken, req.params.token))
        .limit(1);
      if (!cert || cert.solicitudStatus === "completado") return res.json({ ok: true });
      if (cert.solicitudStatus === "enviado") {
        await db.update(certifications)
          .set({ solicitudStatus: "abierto", solicitudOpenedAt: new Date(), updatedAt: new Date() })
          .where(eq(certifications.id, cert.id));
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true });
    }
  });

  // Public: submit solicitud form (calculates price, updates cert)
  app.post("/api/solicitud/:token/submit", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.solicitudToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
      if (cert.solicitudStatus === "completado") {
        return res.status(409).json({ message: "Este formulario ya fue enviado" });
      }

      const {
        ownerName, ownerEmail, ownerPhone, ownerDni,
        address, city, postalCode, province,
        propertyType, constructionYear, totalArea, numPlantas, cadastralReference,
      } = req.body;

      // Calculate estimated price
      let estimatedPrice: number | null = null;
      if (propertyType) {
        const [rate] = await db.select().from(pricingRates)
          .where(and(eq(pricingRates.userId, cert.userId!), eq(pricingRates.propertyType, propertyType), eq(pricingRates.isActive, true)))
          .limit(1);
        if (rate) {
          const p = calcularPrecio(
            parseFloat(rate.basePrice as any),
            totalArea ? parseFloat(totalArea) : null,
            province ?? null,
            rate.areaTiers,
            rate.provinceSurcharges,
          );
          estimatedPrice = p.total;
        }
      }

      const [updated] = await db.update(certifications)
        .set({
          ownerName: ownerName || cert.ownerName,
          ownerEmail: ownerEmail || cert.ownerEmail,
          ownerPhone: ownerPhone || cert.ownerPhone,
          ownerDni: ownerDni || cert.ownerDni,
          address: address || cert.address,
          city: city || cert.city,
          postalCode: postalCode || cert.postalCode,
          province: province || cert.province,
          propertyType: propertyType || cert.propertyType,
          constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
          totalArea: totalArea || cert.totalArea,
          numPlantas: numPlantas ? parseInt(numPlantas) : cert.numPlantas,
          cadastralReference: cadastralReference || cert.cadastralReference,
          estimatedPrice: estimatedPrice !== null ? String(estimatedPrice) : cert.estimatedPrice,
          solicitudStatus: "completado",
          solicitudCompletedAt: new Date(),
          workflowStatus: "solicitud_completada",
          status: "En Proceso",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, cert.id))
        .returning();

      // Notify certifier (email + in-app)
      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      if (certifier?.email) {
        sendNuevaSolicitudEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName: ownerName || cert.ownerName || "Propietario",
          ownerPhone: ownerPhone || cert.ownerPhone || null,
          ownerEmail: ownerEmail || cert.ownerEmail || null,
          propertyAddress: address ? `${address}, ${city ?? ""}`.trimEnd().replace(/,$/, "") : null,
          certificationId: cert.id,
        });
      }

      // In-app notification
      createNotification({
        userId: cert.userId!,
        tipo: "solicitud_completada",
        mensaje: `${ownerName || cert.ownerName || "Propietario"} completó el formulario de tasación`,
        certificationId: cert.id,
        metadata: { ownerName: ownerName || cert.ownerName, address: address || cert.address },
      }).catch(console.error);

      res.json({ ok: true, estimatedPrice });
    } catch {
      res.status(500).json({ message: "Error al enviar formulario" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PRESUPUESTO FLOW
  // ─────────────────────────────────────────────────────────────────────────

  // Certifier generates presupuesto
  app.post("/api/certifications/:id/generate-presupuesto", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);
      const { finalPrice, plazoEntregaDias } = req.body;

      const [cert] = await db.select().from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      const token = cert.presupuestoToken ?? nanoid(32);
      const payToken = cert.paymentToken ?? nanoid(32);

      // Calculate installments
      const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const tramo1Pct = certifier?.tramo1Percent ?? 25;
      const price = finalPrice ? parseFloat(finalPrice) : (cert.estimatedPrice ? parseFloat(cert.estimatedPrice as any) : 0);
      const tramo1Amt = parseFloat(((price * tramo1Pct) / 100).toFixed(2));
      const tramo2Amt = parseFloat((price - tramo1Amt).toFixed(2));

      await db.update(certifications)
        .set({
          presupuestoToken: token,
          paymentToken: payToken,
          presupuestoStatus: "enviado",
          presupuestoSentAt: new Date(),
          finalPrice: String(price),
          tramo1Amount: String(tramo1Amt),
          tramo2Amount: String(tramo2Amt),
          plazoEntregaDias: plazoEntregaDias ?? certifier?.plazoEntregaDias ?? 10,
          workflowStatus: "presupuesto_enviado",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, certId));

      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const url = `${protocol}://${host}/presupuesto/${token}`;

      const ownerEmail = cert.ownerEmail;
      if (ownerEmail) {
        sendPresupuestoEmail({
          to: ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          certifierCompany: certifier?.company ?? null,
          presupuestoUrl: url,
          propertyAddress: cert.address ?? null,
          amount: price,
          plazoEntregaDias: plazoEntregaDias ?? certifier?.plazoEntregaDias ?? 10,
        });
      }

      res.json({ token, url, emailSent: !!ownerEmail });
    } catch {
      res.status(500).json({ message: "Error al generar presupuesto" });
    }
  });

  // Public: get presupuesto data
  app.get("/api/presupuesto/:token", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.presupuestoToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado o enlace inválido" });

      const [certifier] = await db.select({
        name: users.name,
        firstName: users.firstName,
        company: users.company,
        licenseNumber: users.licenseNumber,
        dniNif: users.dniNif,
        address: users.address,
        city: users.city,
        phone: users.phone,
        email: users.email,
        condicionesServicio: users.condicionesServicio,
      }).from(users).where(eq(users.id, cert.userId!)).limit(1);

      res.json({
        status: cert.presupuestoStatus,
        cert: {
          ownerName: cert.ownerName,
          address: cert.address,
          city: cert.city,
          province: cert.province,
          propertyType: cert.propertyType,
          totalArea: cert.totalArea,
          constructionYear: cert.constructionYear,
          finalPrice: cert.finalPrice,
          tramo1Amount: cert.tramo1Amount,
          tramo2Amount: cert.tramo2Amount,
          plazoEntregaDias: cert.plazoEntregaDias,
        },
        certifier: {
          name: certifier?.name ?? certifier?.firstName ?? "Certificador",
          company: certifier?.company ?? null,
          licenseNumber: certifier?.licenseNumber ?? null,
          dniNif: certifier?.dniNif ?? null,
          address: certifier?.address ?? null,
          city: certifier?.city ?? null,
          phone: certifier?.phone ?? null,
          email: certifier?.email ?? null,
          condicionesServicio: certifier?.condicionesServicio ?? null,
        },
        paymentToken: cert.paymentToken,
      });
    } catch {
      res.status(500).json({ message: "Error al cargar presupuesto" });
    }
  });

  // Public: accept presupuesto
  app.post("/api/presupuesto/:token/aceptar", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.presupuestoToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado" });
      if (cert.presupuestoStatus === "aceptado") {
        return res.json({ ok: true, paymentToken: cert.paymentToken });
      }

      await db.update(certifications)
        .set({
          presupuestoStatus: "aceptado",
          presupuestoAceptadoAt: new Date(),
          workflowStatus: "presupuesto_aceptado",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, cert.id));

      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      if (certifier?.email) {
        sendPresupuestoAceptadoEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName: cert.ownerName ?? "Propietario",
          propertyAddress: cert.address ?? null,
          amount: cert.finalPrice ? parseFloat(cert.finalPrice as any) : 0,
          certificationId: cert.id,
        });
      }

      // Send payment link to owner
      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const payUrl = `${protocol}://${host}/pay/${cert.paymentToken}`;

      if (cert.ownerEmail && cert.paymentToken) {
        sendPaymentLinkEmail({
          to: cert.ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? "Tu certificador",
          paymentUrl: payUrl,
          amount: cert.tramo1Amount ? parseFloat(cert.tramo1Amount as any) : 0,
          tramo: 1,
          propertyAddress: cert.address ?? null,
        });
      }

      // In-app notification
      createNotification({
        userId: cert.userId!,
        tipo: "presupuesto_aceptado",
        mensaje: `${cert.ownerName || "El cliente"} aceptó el presupuesto de ${cert.finalPrice ? parseFloat(cert.finalPrice as any).toFixed(2) : "—"} €`,
        certificationId: cert.id,
        metadata: { ownerName: cert.ownerName, amount: cert.finalPrice },
      }).catch(console.error);

      res.json({ ok: true, paymentToken: cert.paymentToken });
    } catch {
      res.status(500).json({ message: "Error al aceptar presupuesto" });
    }
  });

  // Public: request presupuesto modification
  app.post("/api/presupuesto/:token/modificar", async (req: Request, res: Response) => {
    try {
      const { motivo } = req.body;
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.presupuestoToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado" });

      await db.update(certifications)
        .set({
          presupuestoStatus: "modificacion_solicitada",
          modificacionSolicitada: true,
          modificacionMotivo: motivo || "",
          workflowStatus: "presupuesto_modificacion",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, cert.id));

      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      if (certifier?.email) {
        sendModificacionPresupuestoEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName: cert.ownerName ?? "Propietario",
          motivo: motivo || "",
          certificationId: cert.id,
        });
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al solicitar modificación" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PAYMENT FLOW
  // ─────────────────────────────────────────────────────────────────────────

  // Public: get payment page data
  app.get("/api/pay/:token", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.paymentToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Enlace de pago inválido" });

      const tramo = cert.tramo1PaidAt ? 2 : 1;
      const amount = tramo === 1
        ? (cert.tramo1Amount ? parseFloat(cert.tramo1Amount as any) : 0)
        : (cert.tramo2Amount ? parseFloat(cert.tramo2Amount as any) : 0);

      const [certifier] = await db.select({
        name: users.name,
        company: users.company,
        phone: users.phone,
        email: users.email,
        bizumPhone: users.bizumPhone,
        iban: users.iban,
        enabledPaymentMethods: users.enabledPaymentMethods,
      }).from(users).where(eq(users.id, cert.userId!)).limit(1);

      res.json({
        tramo,
        amount,
        totalAmount: cert.finalPrice ? parseFloat(cert.finalPrice as any) : 0,
        cert: {
          ownerName: cert.ownerName,
          address: cert.address,
          city: cert.city,
          propertyType: cert.propertyType,
        },
        certifier: {
          name: certifier?.name ?? "Tu certificador",
          company: certifier?.company ?? null,
          phone: certifier?.phone ?? null,
          email: certifier?.email ?? null,
          bizumPhone: certifier?.bizumPhone ?? null,
          iban: certifier?.iban ?? null,
          enabledPaymentMethods: (certifier?.enabledPaymentMethods as string[]) ?? ["stripe", "bizum", "transferencia", "efectivo"],
        },
        alreadyPaid: tramo === 2 && !!cert.tramo2PaidAt,
      });
    } catch {
      res.status(500).json({ message: "Error al cargar datos de pago" });
    }
  });

  // Public: create Stripe PaymentIntent
  app.post("/api/pay/:token/stripe-intent", async (req: Request, res: Response) => {
    try {
      if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });

      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.paymentToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Enlace inválido" });

      const tramo = cert.tramo1PaidAt ? 2 : 1;
      const amount = tramo === 1
        ? parseFloat((cert.tramo1Amount ?? "0") as any)
        : parseFloat((cert.tramo2Amount ?? "0") as any);

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "eur",
        metadata: { certificationId: String(cert.id), tramo: String(tramo) },
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: intent.client_secret });
    } catch {
      res.status(500).json({ message: "Error al crear intención de pago" });
    }
  });

  // Public: notify manual payment (bizum / transfer / cash)
  app.post("/api/pay/:token/manual", async (req: Request, res: Response) => {
    try {
      const { metodo, notas } = req.body;
      if (!metodo) return res.status(400).json({ message: "Método de pago requerido" });

      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.paymentToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Enlace inválido" });

      const tramo = cert.tramo1PaidAt ? 2 : 1;
      const amount = tramo === 1
        ? parseFloat((cert.tramo1Amount ?? "0") as any)
        : parseFloat((cert.tramo2Amount ?? "0") as any);

      await db.insert(payments).values({
        userId: cert.userId!,
        certificationId: cert.id,
        amount: String(amount),
        currency: "eur",
        status: "pending",
        tramo,
        metodo,
        estadoConfirmacion: "pendiente_confirmacion",
        fechaNotificacion: new Date(),
        notas: notas || null,
        description: `Tramo ${tramo} - ${metodo} - ${cert.ownerName ?? ""}`,
      });

      await db.update(certifications)
        .set({ workflowStatus: `pago_${tramo}_pendiente`, updatedAt: new Date() })
        .where(eq(certifications.id, cert.id));

      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      if (certifier?.email) {
        sendPagoManualPendienteEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName: cert.ownerName ?? "Propietario",
          metodo,
          amount,
          tramo: tramo as 1 | 2,
        });
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al notificar pago" });
    }
  });

  // Stripe webhook
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;
    try {
      const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
      event = webhookSecret
        ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
        : req.body;
    } catch {
      return res.status(400).json({ message: "Webhook signature invalid" });
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const certId = parseInt(intent.metadata?.certificationId ?? "0");
      const tramo = parseInt(intent.metadata?.tramo ?? "1") as 1 | 2;

      if (certId) {
        const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId)).limit(1);
        if (cert) {
          const amount = tramo === 1
            ? parseFloat((cert.tramo1Amount ?? "0") as any)
            : parseFloat((cert.tramo2Amount ?? "0") as any);

          await db.update(certifications)
            .set({
              [`tramo${tramo}PaidAt`]: new Date(),
              workflowStatus: `pago_${tramo}_confirmado`,
              updatedAt: new Date(),
            })
            .where(eq(certifications.id, certId));

          // If tramo 1, auto-generate CEE form link
          const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);

          if (tramo === 1 && certifier) {
            const ceeToken = cert.ceeToken ?? nanoid(32);
            await db.update(certifications)
              .set({ ceeToken, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
              .where(eq(certifications.id, certId));

            const host = "certifive.es";
            const ceeUrl = `https://${host}/formulario-cee/${ceeToken}`;
            if (cert.ownerEmail) {
              sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier.name ?? certifier.username, amount, tramo, ceeFormUrl: ceeUrl });
              sendCEEFormLinkEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier.name ?? certifier.username, ceeFormUrl: ceeUrl, propertyAddress: cert.address ?? null });
            }
          } else if (tramo === 2 && cert.ownerEmail) {
            sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo, ceeFormUrl: null });
          }
        }
      }
    }

    res.json({ received: true });
  });

  // Authenticated: get pending manual payments
  app.get("/api/payments/pending", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const pending = await db.select({
        id: payments.id,
        certificationId: payments.certificationId,
        amount: payments.amount,
        metodo: payments.metodo,
        tramo: payments.tramo,
        notas: payments.notas,
        estadoConfirmacion: payments.estadoConfirmacion,
        fechaNotificacion: payments.fechaNotificacion,
        ownerName: certifications.ownerName,
        address: certifications.address,
        city: certifications.city,
      })
        .from(payments)
        .leftJoin(certifications, eq(payments.certificationId, certifications.id))
        .where(and(
          eq(payments.userId, userId),
          eq(payments.estadoConfirmacion, "pendiente_confirmacion"),
        ))
        .orderBy(desc(payments.fechaNotificacion));

      res.json(pending);
    } catch {
      res.status(500).json({ message: "Error al obtener cobros pendientes" });
    }
  });

  // Authenticated: confirm manual payment
  app.post("/api/payments/:id/confirm", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const paymentId = parseInt(req.params.id);

      const [payment] = await db.select().from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
        .limit(1);
      if (!payment) return res.status(404).json({ message: "Pago no encontrado" });

      await db.update(payments)
        .set({
          estadoConfirmacion: "confirmado",
          fechaConfirmacion: new Date(),
          confirmadoPor: userId,
          status: "succeeded",
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));

      if (payment.certificationId) {
        const [cert] = await db.select().from(certifications).where(eq(certifications.id, payment.certificationId)).limit(1);
        const tramo = payment.tramo as 1 | 2;
        const amount = parseFloat(payment.amount as any);

        await db.update(certifications)
          .set({
            [`tramo${tramo}PaidAt`]: new Date(),
            workflowStatus: `pago_${tramo}_confirmado`,
            updatedAt: new Date(),
          })
          .where(eq(certifications.id, payment.certificationId));

        const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        if (cert?.ownerEmail) {
          // Send payment confirmation
          if (tramo === 1) {
            // Auto-generate CEE form if not exists
            const ceeToken = cert.ceeToken ?? nanoid(32);
            if (!cert.ceeToken) {
              await db.update(certifications)
                .set({ ceeToken, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
                .where(eq(certifications.id, cert.id));
            }
            const host = req.headers.host ?? "localhost:5000";
            const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
            const ceeUrl = `${protocol}://${host}/formulario-cee/${ceeToken}`;
            sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo: 1, ceeFormUrl: ceeUrl });
            sendCEEFormLinkEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", ceeFormUrl: ceeUrl, propertyAddress: cert.address ?? null });
          } else {
            sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo: 2, ceeFormUrl: null });
          }
        }
      }

      // In-app notification
      if (payment.userId && payment.certificationId) {
        const [paymentCert] = await db.select().from(certifications).where(eq(certifications.id, payment.certificationId)).limit(1).catch(() => [null]);
        createNotification({
          userId: payment.userId,
          tipo: "pago_recibido",
          mensaje: `Pago confirmado: ${parseFloat(payment.amount as any).toFixed(2)} € (Tramo ${payment.tramo})${paymentCert?.ownerName ? ` · ${paymentCert.ownerName}` : ""}`,
          certificationId: payment.certificationId,
          metadata: { amount: payment.amount, tramo: payment.tramo, metodo: payment.metodo },
        }).catch(console.error);
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al confirmar pago" });
    }
  });

  // Authenticated: reject manual payment
  app.post("/api/payments/:id/reject", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const paymentId = parseInt(req.params.id);
      const { motivo } = req.body;

      const [rejectedPayment] = await db.update(payments)
        .set({
          estadoConfirmacion: "rechazado",
          fechaConfirmacion: new Date(),
          confirmadoPor: userId,
          notas: motivo ? `RECHAZADO: ${motivo}` : "RECHAZADO",
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
        .returning();

      // In-app notification
      if (rejectedPayment?.certificationId) {
        const [rejCert] = await db.select().from(certifications).where(eq(certifications.id, rejectedPayment.certificationId)).limit(1).catch(() => [null]);
        createNotification({
          userId,
          tipo: "pago_fallido",
          mensaje: `Pago rechazado: ${parseFloat(rejectedPayment.amount as any).toFixed(2)} €${motivo ? ` — ${motivo}` : ""}${rejCert?.ownerName ? ` · ${rejCert.ownerName}` : ""}`,
          certificationId: rejectedPayment.certificationId,
          metadata: { amount: rejectedPayment.amount, motivo },
        }).catch(console.error);
      }

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al rechazar pago" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CEE FORM FLOW  (Formulario 2 — detallado)
  // ─────────────────────────────────────────────────────────────────────────

  // Certifier sends CEE form link
  app.post("/api/certifications/:id/generate-cee-form", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);

      const [cert] = await db.select().from(certifications)
        .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

      const token = cert.ceeToken ?? nanoid(32);
      await db.update(certifications)
        .set({ ceeToken: token, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
        .where(eq(certifications.id, certId));

      const host = req.headers.host ?? "localhost:5000";
      const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      const url = `${protocol}://${host}/formulario-cee/${token}`;

      if (cert.ownerEmail) {
        const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        sendCEEFormLinkEmail({
          to: cert.ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          ceeFormUrl: url,
          propertyAddress: cert.address ?? null,
        });
      }

      res.json({ token, url, emailSent: !!cert.ownerEmail });
    } catch {
      res.status(500).json({ message: "Error al generar enlace CEE" });
    }
  });

  // Public: get CEE form data
  app.get("/api/formulario-cee/:token", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.ceeToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });

      // Check if payment 1 is required and confirmed
      const [certifier] = await db.select({
        name: users.name,
        company: users.company,
        phone: users.phone,
        email: users.email,
        blockFormUntilPayment1: users.blockFormUntilPayment1,
      }).from(users).where(eq(users.id, cert.userId!)).limit(1);

      const paymentBlocked = certifier?.blockFormUntilPayment1 && !cert.tramo1PaidAt;

      if (cert.ceeFormStatus === "completado") {
        return res.json({ completed: true });
      }

      if (paymentBlocked) {
        return res.json({
          paymentBlocked: true,
          paymentToken: cert.paymentToken,
          workflowStatus: cert.workflowStatus,
        });
      }

      // Get existing documents
      const docs = await db.select().from(documentos)
        .where(and(eq(documentos.certificationId, cert.id), eq(documentos.subidoPor, "cliente")))
        .orderBy(documentos.fechaSubida);

      res.json({
        completed: false,
        paymentBlocked: false,
        certifier: {
          name: certifier?.name ?? "Tu certificador",
          company: certifier?.company ?? null,
          phone: certifier?.phone ?? null,
        },
        prefill: {
          ownerName: cert.ownerName ?? "",
          ownerEmail: cert.ownerEmail ?? "",
          ownerPhone: cert.ownerPhone ?? "",
          ownerDni: cert.ownerDni ?? "",
          address: cert.address ?? "",
          city: cert.city ?? "",
          postalCode: cert.postalCode ?? "",
          province: cert.province ?? "",
          propertyType: cert.propertyType ?? "",
          constructionYear: cert.constructionYear ?? "",
          totalArea: cert.totalArea ?? "",
          numPlantas: cert.numPlantas ?? "",
          cadastralReference: cert.cadastralReference ?? "",
        },
        existingData: cert.formData ?? null,
        documents: docs,
      });
    } catch {
      res.status(500).json({ message: "Error al cargar formulario" });
    }
  });

  // Public: mark CEE form opened
  app.post("/api/formulario-cee/:token/open", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.ceeToken, req.params.token))
        .limit(1);
      if (!cert || cert.ceeFormStatus === "completado") return res.json({ ok: true });
      if (cert.ceeFormStatus === "enviado") {
        await db.update(certifications)
          .set({ ceeFormStatus: "abierto", ceeFormOpenedAt: new Date(), updatedAt: new Date() })
          .where(eq(certifications.id, cert.id));
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: true });
    }
  });

  // Public: submit CEE form data
  app.post("/api/formulario-cee/:token/submit", async (req: Request, res: Response) => {
    try {
      const [cert] = await db.select().from(certifications)
        .where(eq(certifications.ceeToken, req.params.token))
        .limit(1);
      if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
      if (cert.ceeFormStatus === "completado") {
        return res.status(409).json({ message: "Este formulario ya fue enviado" });
      }

      const {
        ownerName, ownerEmail, ownerPhone, ownerDni,
        address, city, postalCode, province,
        propertyType, constructionYear, totalArea, numPlantas, cadastralReference,
        // Constructive envelope
        cerramientoExterior, tipoVentanas, tipoMarcos, superficieAcristalada,
        anchoVentana, altoVentana, tienePersiana, tipoPersiana,
        // Position
        esUltimaPlanta, tieneLocalDebajo,
        // Heating
        calefaccionTipoInstalacion, tipoCalefaccion, anioCalefaccion, potenciaCalefaccion,
        // Legacy field kept for backward compat
        tieneCalefaccion,
        // ACS
        acsTipoInstalacion, tipoACS, tieneSolares, numPaneles, numOcupantes,
        // Cooling + lighting
        tieneAireAcondicionado, tipoAire, anioAire,
        tipoIluminacion, controlIluminacion,
        // Reforms
        tuvoReformas, reformas,
        // Climate zone (set by frontend from postal code)
        zonaClimatica,
      } = req.body;

      const formData = {
        constructivas: { cerramientoExterior, tipoVentanas, tipoMarcos, superficieAcristalada, anchoVentana, altoVentana, tienePersiana, tipoPersiana },
        calefaccion: { calefaccionTipoInstalacion: calefaccionTipoInstalacion ?? tieneCalefaccion, tipoCalefaccion, anioCalefaccion, potenciaCalefaccion },
        acs: { acsTipoInstalacion, tipoACS, tieneSolares, numPaneles, numOcupantes },
        refrigeracion: { tieneAireAcondicionado, tipoAire, anioAire },
        iluminacion: { tipoIluminacion, controlIluminacion },
        posicion: { esUltimaPlanta, tieneLocalDebajo },
        reformas: { tuvoReformas, lista: reformas ?? [] },
      };

      // Count uploaded documents
      const docs = await db.select().from(documentos)
        .where(and(eq(documentos.certificationId, cert.id), eq(documentos.subidoPor, "cliente")));

      await db.update(certifications)
        .set({
          ownerName: ownerName || cert.ownerName,
          ownerEmail: ownerEmail || cert.ownerEmail,
          ownerPhone: ownerPhone || cert.ownerPhone,
          ownerDni: ownerDni || cert.ownerDni,
          address: address || cert.address,
          city: city || cert.city,
          postalCode: postalCode || cert.postalCode,
          province: province || cert.province,
          propertyType: propertyType || cert.propertyType,
          constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
          totalArea: totalArea || cert.totalArea,
          numPlantas: numPlantas ? parseInt(numPlantas) : cert.numPlantas,
          cadastralReference: cadastralReference || cert.cadastralReference,
          formData: { ...(cert.formData as object ?? {}), ceeDetallado: formData },
          // New dedicated columns
          zonaClimatica: zonaClimatica || cert.zonaClimatica,
          esUltimaPlanta: esUltimaPlanta === "si" ? true : esUltimaPlanta === "no" ? false : cert.esUltimaPlanta,
          tieneLocalDebajo: tieneLocalDebajo === "si" ? true : tieneLocalDebajo === "no" ? false : cert.tieneLocalDebajo,
          calefaccionTipoInstalacion: calefaccionTipoInstalacion ?? tieneCalefaccion ?? cert.calefaccionTipoInstalacion,
          calefaccionSistema: tipoCalefaccion || cert.calefaccionSistema,
          acsTipoInstalacion: acsTipoInstalacion || cert.acsTipoInstalacion,
          acsSistema: tipoACS || cert.acsSistema,
          numOcupantes: numOcupantes ? parseInt(String(numOcupantes)) : cert.numOcupantes,
          tieneReformas: tuvoReformas === "si" ? true : tuvoReformas === "no" ? false : cert.tieneReformas,
          reformas: Array.isArray(reformas) && reformas.length > 0 ? reformas : cert.reformas,
          ceeFormStatus: "completado",
          ceeFormCompletedAt: new Date(),
          workflowStatus: "formulario_cee_completado",
          status: "En Proceso",
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, cert.id));

      // Notify certifier (email + in-app)
      const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
      if (certifier?.email) {
        sendDocumentosRecibidosEmail({
          to: certifier.email,
          certifierName: certifier.name ?? certifier.username,
          ownerName: ownerName || cert.ownerName || "Propietario",
          ownerPhone: ownerPhone || cert.ownerPhone || null,
          propertyAddress: address || cert.address || null,
          numDocumentos: docs.length,
          certificationId: cert.id,
        });
      }

      // In-app notification
      createNotification({
        userId: cert.userId!,
        tipo: "cee_completado",
        mensaje: `${ownerName || cert.ownerName || "El propietario"} completó el formulario CEE${docs.length > 0 ? ` y subió ${docs.length} documento${docs.length !== 1 ? "s" : ""}` : ""}`,
        certificationId: cert.id,
        metadata: { ownerName: ownerName || cert.ownerName, numDocs: docs.length },
      }).catch(console.error);

      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al enviar formulario" });
    }
  });

  // Public: upload document (client side, during CEE form)
  const ceeUploadDir = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const certId = req.params.certId;
        const dir = `uploads/certs/${certId}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${nanoid(12)}${ext}`);
      },
    }),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".heic", ".heif", ".doc", ".docx"];
      cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    },
  });

  app.post("/api/formulario-cee/:token/upload/:certId", ceeUploadDir.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });
      const { tipoDoc = "otro" } = req.body;
      const certId = parseInt(req.params.certId);

      // Verify token matches certId
      const [cert] = await db.select({ id: certifications.id, ceeToken: certifications.ceeToken })
        .from(certifications).where(eq(certifications.id, certId)).limit(1);
      if (!cert || cert.ceeToken !== req.params.token) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const [doc] = await db.insert(documentos).values({
        certificationId: certId,
        nombreOriginal: req.file.originalname,
        nombreArchivo: req.file.filename,
        path: req.file.path,
        mimeType: req.file.mimetype,
        tamano: req.file.size,
        tipoDoc,
        subidoPor: "cliente",
        estadoRevision: "pendiente",
      }).returning();

      res.json(doc);
    } catch {
      res.status(500).json({ message: "Error al subir archivo" });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTS (certifier side)
  // ─────────────────────────────────────────────────────────────────────────

  app.get("/api/certifications/:id/documentos", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);

      // Verify ownership
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

  // Certifier uploads a document (e.g., the final certificate)
  const certifierUpload = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const certId = req.params.id;
        const dir = `uploads/certs/${certId}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        cb(null, `${nanoid(12)}${path.extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ok = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".zip"];
      cb(null, ok.includes(path.extname(file.originalname).toLowerCase()));
    },
  });

  app.post("/api/certifications/:id/documentos", authenticate, certifierUpload.single("file"), async (req: Request, res: Response) => {
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

      const [doc] = await db.insert(documentos).values({
        certificationId: certId,
        nombreOriginal: req.file.originalname,
        nombreArchivo: req.file.filename,
        path: req.file.path,
        mimeType: req.file.mimetype,
        tamano: req.file.size,
        tipoDoc,
        subidoPor: "certificador",
        estadoRevision: "revisado",
      }).returning();

      res.json(doc);
    } catch {
      res.status(500).json({ message: "Error al subir documento" });
    }
  });

  // Update document estado (certifier)
  app.put("/api/documentos/:id/estado", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const docId = parseInt(req.params.id);
      const { estadoRevision, motivoRechazo } = req.body;

      // Get the doc and verify certifier owns the certification
      const [doc] = await db.select().from(documentos).where(eq(documentos.id, docId)).limit(1);
      if (!doc) return res.status(404).json({ message: "Documento no encontrado" });

      const [cert] = await db.select({ userId: certifications.userId, ownerEmail: certifications.ownerEmail, ownerName: certifications.ownerName, address: certifications.address, ceeToken: certifications.ceeToken })
        .from(certifications).where(eq(certifications.id, doc.certificationId)).limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      const [updated] = await db.update(documentos)
        .set({ estadoRevision, motivoRechazo: motivoRechazo || null })
        .where(eq(documentos.id, docId))
        .returning();

      // If rejected, notify owner
      if (estadoRevision === "rechazado" && cert.ownerEmail && motivoRechazo && cert.ceeToken) {
        const [certifier] = await db.select({ name: users.name, username: users.username }).from(users).where(eq(users.id, userId)).limit(1);
        const host = req.headers.host ?? "localhost:5000";
        const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");

        const tipoLabels: Record<string, string> = {
          factura_luz: "Factura de electricidad",
          factura_gas: "Factura de gas",
          referencia_catastral: "Referencia catastral",
          planos: "Planos del inmueble",
          certificado: "Certificado",
          otro: "Documento adjunto",
        };

        sendDocumentoRechazadoEmail({
          to: cert.ownerEmail,
          ownerName: cert.ownerName ?? "",
          certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
          tipoDoc: tipoLabels[doc.tipoDoc] ?? doc.tipoDoc,
          motivo: motivoRechazo,
          ceeFormUrl: `${protocol}://${host}/formulario-cee/${cert.ceeToken}`,
        });
      }

      res.json(updated);
    } catch {
      res.status(500).json({ message: "Error al actualizar documento" });
    }
  });

  app.delete("/api/documentos/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const docId = parseInt(req.params.id);

      const [doc] = await db.select().from(documentos).where(eq(documentos.id, docId)).limit(1);
      if (!doc) return res.status(404).json({ message: "Documento no encontrado" });

      const [cert] = await db.select({ userId: certifications.userId }).from(certifications).where(eq(certifications.id, doc.certificationId)).limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      // Delete file from disk
      try { fs.unlinkSync(doc.path); } catch {}

      await db.delete(documentos).where(eq(documentos.id, docId));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al eliminar documento" });
    }
  });

  // Serve uploaded files (certifier auth required for certifier's certs)
  app.get("/api/uploads/:certId/:filename", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.certId);

      const [cert] = await db.select({ userId: certifications.userId }).from(certifications).where(eq(certifications.id, certId)).limit(1);
      if (!cert || cert.userId !== userId) return res.status(403).json({ message: "No autorizado" });

      const filePath = path.resolve(`uploads/certs/${certId}/${req.params.filename}`);
      if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Archivo no encontrado" });
      res.sendFile(filePath);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // WHATSAPP BUSINESS — Connection management
  // ══════════════════════════════════════════════════════════════════════════════

  // GET /api/whatsapp/status — current connection state
  app.get("/api/whatsapp/status", authenticate, async (req: any, res) => {
    try {
      const userId = req.user?.id ?? req.userId;
      const [u] = await db.select().from(users).where(eq(users.id, userId));
      const connected = !!(u as any).whatsappApiKey;
      res.json({
        connected,
        phone: (u as any).whatsappPhone ?? null,
        connectedAt: (u as any).whatsappConnectedAt ?? null,
      });
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // POST /api/whatsapp/connect — validate and save an API key
  app.post("/api/whatsapp/connect", authenticate, async (req: any, res) => {
    const { apiKey, phone } = req.body;
    if (!apiKey) return res.status(400).json({ message: "apiKey requerida" });
    try {
      const check = await validateApiKey(apiKey);
      if (!check.valid) return res.status(400).json({ message: check.error ?? "API key inválida" });

      await db.update(users).set({
        whatsappApiKey: encryptApiKey(apiKey),
        whatsappPhone: phone ?? null,
        whatsappConnectedAt: new Date(),
        updatedAt: new Date(),
      } as any).where(eq(users.id, req.userId));

      res.json({ ok: true, phone: phone ?? null });
    } catch {
      res.status(500).json({ message: "Error al conectar WhatsApp" });
    }
  });

  // DELETE /api/whatsapp/disconnect — remove WhatsApp credentials
  app.delete("/api/whatsapp/disconnect", authenticate, async (req: any, res) => {
    try {
      await db.update(users).set({
        whatsappApiKey: null,
        whatsappPhone: null,
        whatsappConnectedAt: null,
        updatedAt: new Date(),
      } as any).where(eq(users.id, req.userId));
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // WHATSAPP BUSINESS — Message templates
  // ══════════════════════════════════════════════════════════════════════════════

  // GET /api/whatsapp/templates — all 8 templates (custom or default)
  app.get("/api/whatsapp/templates", authenticate, async (req: any, res) => {
    try {
      const customs = await db
        .select()
        .from(plantillasWhatsapp)
        .where(eq(plantillasWhatsapp.userId, req.userId));

      const result = Object.entries(TEMPLATE_LABELS).map(([num, label]) => {
        const tipo = parseInt(num);
        const custom = customs.find(c => c.tipoMensaje === tipo);
        return {
          tipo,
          label,
          contenido: custom?.contenido ?? DEFAULT_TEMPLATES[tipo] ?? "",
          isCustom: !!custom,
          placeholders: AVAILABLE_PLACEHOLDERS,
        };
      });
      res.json(result);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // PUT /api/whatsapp/templates/:tipo — upsert a single template
  app.put("/api/whatsapp/templates/:tipo", authenticate, async (req: any, res) => {
    const tipo = parseInt(req.params.tipo);
    const { contenido } = req.body;
    if (!tipo || !contenido) return res.status(400).json({ message: "Datos incompletos" });
    try {
      const [existing] = await db
        .select()
        .from(plantillasWhatsapp)
        .where(and(eq(plantillasWhatsapp.userId, req.userId), eq(plantillasWhatsapp.tipoMensaje, tipo)));

      if (existing) {
        await db.update(plantillasWhatsapp)
          .set({ contenido, updatedAt: new Date() })
          .where(eq(plantillasWhatsapp.id, existing.id));
      } else {
        await db.insert(plantillasWhatsapp).values({
          userId: req.userId,
          tipoMensaje: tipo,
          contenido,
        });
      }
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al guardar plantilla" });
    }
  });

  // DELETE /api/whatsapp/templates/:tipo — reset to default
  app.delete("/api/whatsapp/templates/:tipo", authenticate, async (req: any, res) => {
    const tipo = parseInt(req.params.tipo);
    try {
      await db.delete(plantillasWhatsapp)
        .where(and(eq(plantillasWhatsapp.userId, req.userId), eq(plantillasWhatsapp.tipoMensaje, tipo)));
      res.json({ ok: true, contenido: DEFAULT_TEMPLATES[tipo] });
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // MENSAJES COMUNICACIÓN — History & manual send
  // ══════════════════════════════════════════════════════════════════════════════

  // GET /api/certifications/:id/mensajes — communication timeline
  app.get("/api/certifications/:id/mensajes", authenticate, async (req: any, res) => {
    const certId = parseInt(req.params.id);
    try {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
      if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

      const msgs = await db
        .select()
        .from(mensajesComunicacion)
        .where(eq(mensajesComunicacion.certificationId, certId))
        .orderBy(mensajesComunicacion.fechaEnvio);

      res.json(msgs);
    } catch {
      res.status(500).json({ message: "Error" });
    }
  });

  // POST /api/certifications/:id/mensajes — send a manual message
  app.post("/api/certifications/:id/mensajes", authenticate, async (req: any, res) => {
    const certId = parseInt(req.params.id);
    const { texto, canal } = req.body;
    if (!texto) return res.status(400).json({ message: "Texto requerido" });
    try {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
      if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

      await sendNotification({ certificationId: certId, tipo: "manual", manualText: texto });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al enviar mensaje" });
    }
  });

  // POST /api/certifications/:id/mensajes/:msgId/retry — retry a failed message
  app.post("/api/certifications/:id/mensajes/:msgId/retry", authenticate, async (req: any, res) => {
    const certId = parseInt(req.params.id);
    const msgId  = parseInt(req.params.msgId);
    try {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
      if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

      await retryMensaje(msgId);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al reintentar" });
    }
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SENDNOTIFICATION — Trigger endpoints for certifier dashboard actions
  // ══════════════════════════════════════════════════════════════════════════════

  // POST /api/certifications/:id/notify/:tipo — send a specific notification type
  app.post("/api/certifications/:id/notify/:tipo", authenticate, async (req: any, res) => {
    const certId = parseInt(req.params.id);
    const tipo   = req.params.tipo === "manual"
      ? ("manual" as const)
      : parseInt(req.params.tipo) as any;
    const { manualText, documentUrl } = req.body;
    try {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
      if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

      await sendNotification({ certificationId: certId, tipo, manualText, documentUrl });
      res.json({ ok: true });
    } catch {
      res.status(500).json({ message: "Error al enviar notificación" });
    }
  });

  // ── BETA LEADS ──────────────────────────────────────────────────────────────

  // POST /api/beta-leads — landing page registration
  app.post("/api/beta-leads", async (req, res) => {
    const { nombre, email, telefono, provincia, certificacionesMes } = req.body ?? {};

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "El email no es válido" });
    }

    try {
      // Check for duplicate — silently succeed so we don't expose who's registered
      const existing = await db
        .select({ id: betaLeads.id })
        .from(betaLeads)
        .where(eq(betaLeads.email, email.trim().toLowerCase()))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(betaLeads).values({
          nombre:             nombre.trim(),
          email:              email.trim().toLowerCase(),
          telefono:           telefono?.trim() || null,
          provincia:          provincia || null,
          certificacionesMes: certificacionesMes ? parseInt(certificacionesMes) : null,
        });
      }

      // Always send confirmation (even on duplicate — user may have refreshed)
      sendBetaLeadConfirmation({ to: email.trim().toLowerCase(), nombre: nombre.trim() }).catch(() => {});

      res.json({ ok: true });
    } catch (err) {
      console.error("[beta-leads] Error:", err);
      res.status(500).json({ message: "Error al guardar el registro" });
    }
  });
}
