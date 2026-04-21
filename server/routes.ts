import { Express, Request, Response } from "express";
import { db } from "./db";
import { users, certifications, folders, pricingRates, quoteRequests, invoices } from "../shared/schema";
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
import multer from "multer";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

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
    // Placeholder: in production this would send a password reset email
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email requerido" });
    }
    // Always return success to prevent email enumeration
    res.json({ message: "Si ese email está registrado, recibirás un enlace para restablecer tu contraseña." });
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

  // --- UPLOAD ---

  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
  app.post("/api/upload", authenticate, upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });
    res.json({ filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });
}
