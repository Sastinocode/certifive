import { Express, Request, Response } from "express";
import { db } from "./db";
import { users, certifications, folders, pricingRates, quoteRequests, invoices } from "../shared/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";
import { authenticate, hashPassword, comparePasswords, generateToken, createDemoUser } from "./auth";
import { insertUserSchema, insertCertificationSchema, insertFolderSchema, insertPricingRateSchema } from "../shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: "Username and password required" });

      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

      const valid = await comparePasswords(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });

      const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName });
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name } });
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, firstName, lastName, phone, company, licenseNumber } = req.body;
      if (!username || !password) return res.status(400).json({ message: "Username and password required" });

      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing.length > 0) return res.status(400).json({ message: "Username already exists" });

      const hashed = await hashPassword(password);
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
      }).returning();

      const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role, name: user.name, firstName: user.firstName, lastName: user.lastName });
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name } });
    } catch (err) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/demo", async (_req: Request, res: Response) => {
    try {
      const demo = await createDemoUser();
      res.json({ token: "demo-token", user: demo });
    } catch (err) {
      res.status(500).json({ message: "Demo login failed" });
    }
  });

  app.get("/api/auth/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.put("/api/auth/user", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { firstName, lastName, email, phone, company, licenseNumber, dniNif, address, city, postalCode, province } = req.body;
      const name = `${firstName || ""} ${lastName || ""}`.trim();
      const [updated] = await db.update(users).set({ firstName, lastName, name, email, phone, company, licenseNumber, dniNif, address, city, postalCode, province, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (err) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/certifications", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { search, status, archived } = req.query;
      let query = db.select().from(certifications).where(eq(certifications.userId, userId));
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
    } catch (err) {
      res.status(500).json({ message: "Failed to get certifications" });
    }
  });

  app.get("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [cert] = await db.select().from(certifications).where(
        and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId))
      ).limit(1);
      if (!cert) return res.status(404).json({ message: "Certification not found" });
      res.json(cert);
    } catch (err) {
      res.status(500).json({ message: "Failed to get certification" });
    }
  });

  app.post("/api/certifications", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const data = { ...req.body, userId };
      const [cert] = await db.insert(certifications).values(data).returning();
      res.status(201).json(cert);
    } catch (err) {
      res.status(500).json({ message: "Failed to create certification" });
    }
  });

  app.put("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [cert] = await db.update(certifications)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId)))
        .returning();
      if (!cert) return res.status(404).json({ message: "Certification not found" });
      res.json(cert);
    } catch (err) {
      res.status(500).json({ message: "Failed to update certification" });
    }
  });

  app.post("/api/certifications/:id/archive", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const certId = parseInt(req.params.id);
      const [existing] = await db.select().from(certifications).where(
        and(eq(certifications.id, certId), eq(certifications.userId, userId))
      ).limit(1);
      if (!existing) return res.status(404).json({ message: "Certification not found" });

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
    } catch (err) {
      res.status(500).json({ message: "Failed to archive certification" });
    }
  });

  app.delete("/api/certifications/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await db.delete(certifications).where(
        and(eq(certifications.id, parseInt(req.params.id)), eq(certifications.userId, userId))
      );
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete certification" });
    }
  });

  app.get("/api/folders", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(folders).where(eq(folders.userId, userId)).orderBy(desc(folders.createdAt));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to get folders" });
    }
  });

  app.post("/api/folders", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [folder] = await db.insert(folders).values({ ...req.body, userId }).returning();
      res.status(201).json(folder);
    } catch (err) {
      res.status(500).json({ message: "Failed to create folder" });
    }
  });

  app.delete("/api/folders/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await db.delete(folders).where(and(eq(folders.id, parseInt(req.params.id)), eq(folders.userId, userId)));
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete folder" });
    }
  });

  app.get("/api/pricing", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(pricingRates).where(eq(pricingRates.userId, userId));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to get pricing rates" });
    }
  });

  app.post("/api/pricing", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const [rate] = await db.insert(pricingRates).values({ ...req.body, userId }).returning();
      res.status(201).json(rate);
    } catch (err) {
      res.status(500).json({ message: "Failed to create pricing rate" });
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
    } catch (err) {
      res.status(500).json({ message: "Failed to update pricing rate" });
    }
  });

  app.delete("/api/pricing/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      await db.delete(pricingRates).where(and(eq(pricingRates.id, parseInt(req.params.id)), eq(pricingRates.userId, userId)));
      res.json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete pricing rate" });
    }
  });

  app.get("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.post("/api/invoices", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const invoiceNumber = `INV-${Date.now()}`;
      const [inv] = await db.insert(invoices).values({ ...req.body, userId, invoiceNumber, issuedAt: new Date() }).returning();
      res.status(201).json(inv);
    } catch (err) {
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.get("/api/stats", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const allCerts = await db.select().from(certifications).where(eq(certifications.userId, userId));
      const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
      const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));

      const stats = {
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
      };
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
  app.post("/api/upload", authenticate, upload.single("file"), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    res.json({ filename: req.file.filename, originalName: req.file.originalname, size: req.file.size });
  });
}
