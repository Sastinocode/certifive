// @ts-nocheck
import { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { users, certifications, folders, refreshTokens } from "../../shared/schema";
import {
  authenticate, hashPassword, comparePasswords,
  generateToken, generateRefreshToken, rotateRefreshToken,
  revokeRefreshToken, createDemoUser,
} from "../auth";
import {
  sendWelcomeEmail, sendEmailVerification, sendPasswordResetEmail,
} from "../email";
import { securityLog } from "../security-logger";
import multer from "multer";
import path from "path";
import { nanoid } from "nanoid";
import { uploadToCloudinary } from "../cloudinary";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "certifive-dev-secret-2024";

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Espera 15 minutos." },
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados registros desde esta IP. Espera una hora." },
});
// ─────────────────────────────────────────────────────────────────────────────

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

export function registerAuthRoutes(app: Express) {
// --- AUTH ---

app.post("/api/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
  const ip = req.ip ?? "unknown";
  try {
    const { username, password, email, rememberMe } = req.body;
    const lookup = username || email;
    if (!lookup || !password) {
      return res.status(400).json({ message: "Usuario y contraseña requeridos" });
    }

    const [user] = await db.select().from(users)
      .where(eq(users.username, lookup))
      .limit(1);

    if (!user) {
      securityLog("LOGIN_FAILED", { reason: "user_not_found", email: lookup, ip });
      return res.status(401).json({ message: "Email o usuario no registrado" });
    }
    if (!user.password) {
      securityLog("LOGIN_FAILED", { reason: "no_password", email: lookup, ip });
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const valid = await comparePasswords(password, user.password);
    if (!valid) {
      securityLog("LOGIN_FAILED", { reason: "wrong_password", email: lookup, ip });
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    if (!user.emailVerifiedAt) {
      securityLog("LOGIN_BLOCKED_UNVERIFIED", { email: lookup, ip });
      return res.status(403).json({
        message: "Debes verificar tu email antes de acceder. Revisa tu bandeja de entrada.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const authUser = { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName };
    const token = generateToken(authUser, !!rememberMe);
    const refreshToken = await generateRefreshToken(user.id, !!rememberMe);

    res.json({ token, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name } });
  } catch (err) {
    console.error("[login] error:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

app.post("/api/auth/register", registerRateLimiter, async (req: Request, res: Response) => {
  const ip = req.ip ?? "unknown";
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
      subscriptionStatus: "trialing",
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning();

    const authUser = { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName };
    const token = generateToken(authUser);
    const refreshToken = await generateRefreshToken(user.id);

    // Fire-and-forget emails — never block the response
    if (user.email) {
      sendWelcomeEmail({ to: user.email, name: user.name ?? user.username, username: user.username });
      sendEmailVerification({ to: user.email, name: user.name ?? user.username, verificationToken });
    }

    securityLog("REGISTER", { email: user.email ?? username, ip });
    res.json({ token, refreshToken, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, subscriptionStatus: user.subscriptionStatus, trialEndsAt: user.subscriptionCurrentPeriodEnd } });
  } catch (error) {
    console.error("[register]", error);
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

app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requerido" });
  try {
    const [user] = await db.select().from(users).where(eq(users.username, email.trim().toLowerCase())).limit(1);
    if (user && !user.emailVerifiedAt && user.email) {
      const verificationToken = nanoid(32);
      await db.update(users)
        .set({ emailVerificationToken: verificationToken, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      sendEmailVerification({ to: user.email, name: user.name ?? user.username, verificationToken });
    }
  } catch {
    // Swallow — never reveal account existence
  }
  res.json({ message: "Si tu email está registrado y no verificado, recibirás un nuevo enlace de verificación." });
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
// ─── Profile: logo y firma — Cloudinary ──────────────────────────────────────
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = [".jpg", ".jpeg", ".png"].includes(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  },
});

app.post("/api/auth/user/logo", authenticate, avatarUpload.single("logo"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "Archivo inválido (máx 2 MB, PNG/JPG)" });
  try {
    const { secure_url } = await uploadToCloudinary(req.file.buffer, {
      folder:        "certifive/avatars",
      resource_type: "image",
    });
    await db.update(users).set({ logoUrl: secure_url, updatedAt: new Date() } as any).where(eq(users.id, req.userId));
    res.json({ url: secure_url });
  } catch {
    res.status(500).json({ message: "Error al subir el logo" });
  }
});

app.post("/api/auth/user/firma", authenticate, avatarUpload.single("firma"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ message: "Archivo inválido (máx 2 MB, PNG/JPG)" });
  try {
    const { secure_url } = await uploadToCloudinary(req.file.buffer, {
      folder:        "certifive/firmas",
      resource_type: "image",
    });
    await db.update(users).set({ firmaUrl: secure_url, updatedAt: new Date() } as any).where(eq(users.id, req.userId));
    res.json({ url: secure_url });
  } catch {
    res.status(500).json({ message: "Error al subir la firma" });
  }
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

}
