import { Express, Request, Response } from "express";
import { db } from "./db";
import { users, certifications, folders, pricingRates, quoteRequests, invoices, formResponses, payments } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";
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
import { insertUserSchema, insertCertificationSchema, insertFolderSchema, insertPricingRateSchema } from "../shared/schema";
import {
  sendWelcomeEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
  sendFormLinkEmail,
  sendOwnerConfirmationEmail,
  sendCertifierNotification,
  sendTestEmail,
} from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "certifive-dev-secret-2024";

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
      const { password: _, emailVerificationToken: __, ...safeUser } = user;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  app.put("/api/auth/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { firstName, lastName, email, phone, company, licenseNumber, dniNif, address, city, postalCode, province } = req.body;
      const name = `${firstName || ""} ${lastName || ""}`.trim();
      const [updated] = await db.update(users)
        .set({ firstName, lastName, name, email, phone, company, licenseNumber, dniNif, address, city, postalCode, province, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      const { password: _, emailVerificationToken: __, ...safeUser } = updated;
      res.json(safeUser);
    } catch {
      res.status(500).json({ message: "Error al actualizar usuario" });
    }
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

  app.get("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
      res.json(result);
    } catch {
      res.status(500).json({ message: "Error al obtener facturas" });
    }
  });

  app.post("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const invoiceNumber = `INV-${Date.now()}`;
      const [inv] = await db.insert(invoices).values({ ...req.body, userId, invoiceNumber, issuedAt: new Date() }).returning();
      res.status(201).json(inv);
    } catch {
      res.status(500).json({ message: "Error al crear factura" });
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
}
