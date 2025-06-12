import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCertificationSchema, updateCertificationSchema, insertPricingRateSchema, insertQuoteRequestSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import Stripe from "stripe";

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

  // Initialize Stripe (only if secret key is available)
  let stripe: Stripe | null = null;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });
  }

  // Pricing rates routes
  app.get("/api/pricing-rates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rates = await storage.getPricingRates(userId);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching pricing rates:", error);
      res.status(500).json({ message: "Error al obtener tarifas" });
    }
  });

  app.post("/api/pricing-rates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPricingRateSchema.parse({
        ...req.body,
        userId,
      });
      
      const rate = await storage.createPricingRate(validatedData);
      res.json(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating pricing rate:", error);
      res.status(500).json({ message: "Error al crear tarifa" });
    }
  });

  app.patch("/api/pricing-rates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rateId = parseInt(req.params.id);
      const validatedData = insertPricingRateSchema.partial().parse(req.body);
      
      const rate = await storage.updatePricingRate(rateId, userId, validatedData);
      
      if (!rate) {
        return res.status(404).json({ message: "Tarifa no encontrada" });
      }
      
      res.json(rate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error updating pricing rate:", error);
      res.status(500).json({ message: "Error al actualizar tarifa" });
    }
  });

  app.delete("/api/pricing-rates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rateId = parseInt(req.params.id);
      
      const success = await storage.deletePricingRate(rateId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Tarifa no encontrada" });
      }
      
      res.json({ message: "Tarifa eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting pricing rate:", error);
      res.status(500).json({ message: "Error al eliminar tarifa" });
    }
  });

  // Quote request routes
  app.post("/api/quote-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quoteRequest, uniqueLink } = await storage.createQuoteRequest(userId);
      
      res.json({ quoteRequest, uniqueLink });
    } catch (error) {
      console.error("Error creating quote request:", error);
      res.status(500).json({ message: "Error al crear solicitud de presupuesto" });
    }
  });

  app.get("/api/quote-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quotes = await storage.getQuotesByUser(userId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Error al obtener presupuestos" });
    }
  });

  // Public quote routes (no authentication required)
  app.get("/api/public/quotes/:uniqueLink", async (req, res) => {
    try {
      const { uniqueLink } = req.params;
      const quote = await storage.getQuoteByLink(uniqueLink);
      
      if (!quote) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }
      
      res.json(quote);
    } catch (error) {
      console.error("Error fetching public quote:", error);
      res.status(500).json({ message: "Error al obtener presupuesto" });
    }
  });

  app.patch("/api/public/quotes/:uniqueLink", async (req, res) => {
    try {
      const { uniqueLink } = req.params;
      const quote = await storage.getQuoteByLink(uniqueLink);
      
      if (!quote) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      // Get pricing rates for this user to calculate quote
      const rates = await storage.getPricingRates(quote.userId);
      const selectedRate = rates.find(rate => rate.propertyType === req.body.propertyType && rate.isActive);
      
      if (!selectedRate) {
        return res.status(400).json({ message: "No hay tarifa disponible para este tipo de propiedad" });
      }

      const basePrice = parseFloat(selectedRate.basePrice);
      const advanceAmount = basePrice * (selectedRate.advancePercentage / 100);

      const updateData = {
        ...req.body,
        basePrice: basePrice.toString(),
        advanceAmount: advanceAmount.toString(),
        deliveryDays: selectedRate.deliveryDays,
        status: 'quoted'
      };

      const updatedQuote = await storage.updateQuoteRequest(uniqueLink, updateData);
      res.json(updatedQuote);
    } catch (error) {
      console.error("Error updating public quote:", error);
      res.status(500).json({ message: "Error al actualizar presupuesto" });
    }
  });

  // Payment routes
  app.post("/api/public/quotes/:uniqueLink/payment", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe no está configurado" });
      }

      const { uniqueLink } = req.params;
      const quote = await storage.getQuoteByLink(uniqueLink);
      
      if (!quote || !quote.advanceAmount) {
        return res.status(404).json({ message: "Presupuesto no encontrado o sin importe" });
      }

      // Get user info for Stripe Connect
      const user = await storage.getUser(quote.userId);
      if (!user || !user.stripeAccountId) {
        return res.status(400).json({ message: "Certificador no tiene cuenta de pago configurada" });
      }

      const amount = Math.round(parseFloat(quote.advanceAmount) * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        transfer_data: {
          destination: user.stripeAccountId,
        },
        metadata: {
          quoteId: quote.id.toString(),
          uniqueLink,
        },
      });

      // Update quote with payment intent ID
      await storage.updateQuoteRequest(uniqueLink, {
        stripePaymentIntentId: paymentIntent.id,
        status: 'payment_pending'
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error al crear pago" });
    }
  });

  // Stripe webhook for payment confirmation
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe no está configurado" });
      }

      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err}`);
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const uniqueLink = paymentIntent.metadata.uniqueLink;

        if (uniqueLink) {
          await storage.updateQuoteRequest(uniqueLink, {
            status: 'paid',
            paidAt: new Date(),
          });
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling stripe webhook:", error);
      res.status(500).json({ message: "Error al procesar webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
