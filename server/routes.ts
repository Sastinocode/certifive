import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCertificationSchema, updateCertificationSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos JPG, JPEG y PNG"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // Get recent certifications
  app.get("/api/certifications/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certifications = await storage.getRecentCertifications(userId);
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching recent certifications:", error);
      res.status(500).json({ message: "Error al obtener certificaciones recientes" });
    }
  });

  // Get all certifications
  app.get("/api/certifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certifications = await storage.getCertificationsByUser(userId);
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Error al obtener certificaciones" });
    }
  });

  // Get specific certification
  app.get("/api/certifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificationId = parseInt(req.params.id);
      const certification = await storage.getCertification(certificationId, userId);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      console.error("Error fetching certification:", error);
      res.status(500).json({ message: "Error al obtener certificación" });
    }
  });

  // Create new certification
  app.post("/api/certifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCertificationSchema.parse({
        ...req.body,
        userId,
      });
      
      const certification = await storage.createCertification(validatedData);
      res.json(certification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating certification:", error);
      res.status(500).json({ message: "Error al crear certificación" });
    }
  });

  // Update certification
  app.patch("/api/certifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificationId = parseInt(req.params.id);
      const validatedData = updateCertificationSchema.parse(req.body);
      
      const certification = await storage.updateCertification(certificationId, userId, validatedData);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error updating certification:", error);
      res.status(500).json({ message: "Error al actualizar certificación" });
    }
  });

  // Upload photos
  app.post("/api/certifications/:id/photos", isAuthenticated, upload.array("photos", 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificationId = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No se subieron archivos" });
      }

      // Process uploaded files
      const photoUrls: string[] = [];
      for (const file of files) {
        // In a real implementation, you would upload to cloud storage
        // For now, we'll just store the file path
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join("uploads", fileName);
        
        // Move file to permanent location
        fs.renameSync(file.path, filePath);
        photoUrls.push(`/uploads/${fileName}`);
      }

      const certification = await storage.addPhotos(certificationId, userId, photoUrls);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }
      
      res.json({ photos: certification.photos });
    } catch (error) {
      console.error("Error uploading photos:", error);
      res.status(500).json({ message: "Error al subir fotos" });
    }
  });

  // Complete certification and generate report
  app.post("/api/certifications/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificationId = parseInt(req.params.id);
      
      const certification = await storage.completeCertification(certificationId, userId);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      console.error("Error completing certification:", error);
      res.status(500).json({ message: "Error al completar certificación" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // In production, you would use cloud storage URLs
    const filePath = path.join(process.cwd(), "uploads", req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
