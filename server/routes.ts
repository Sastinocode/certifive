import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { reportGenerator } from "./reportGenerator";
import { authenticateToken, hashPassword, comparePassword, generateToken } from "./auth";
import { notificationService } from "./notifications";
import { insertCertificationSchema, updateCertificationSchema, insertPricingRateSchema, insertQuoteRequestSchema, insertFolderSchema, insertWhatsappFlowTemplateSchema, insertDemoRequestSchema } from "@shared/schema";
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

  // Local authentication routes
  const registerSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    company: z.string().optional(),
    phone: z.string().optional(),
  });

  const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
  });

  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email ya está registrado" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        passwordHash,
        isVerified: true, // Auto-verify for now
        role: "user",
      });

      // Generate token
      const token = generateToken(user.id);
      
      res.status(201).json({
        message: "Usuario registrado exitosamente",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Error en registro:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Login user
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verify password
      const isValidPassword = await comparePassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Update last login
      await storage.updateUserPassword(user.id, user.passwordHash); // This will update the updatedAt field
      
      // Generate token
      const token = generateToken(user.id);
      
      res.json({
        message: "Inicio de sesión exitoso",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Error en login:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Demo account request
  app.post('/api/auth/demo-request', async (req, res) => {
    try {
      const validatedData = insertDemoRequestSchema.parse(req.body);
      
      const demoRequest = await storage.createDemoRequest(validatedData);
      
      res.status(201).json({
        message: "Solicitud de cuenta demo enviada exitosamente",
        id: demoRequest.id,
      });
    } catch (error: any) {
      console.error("Error en solicitud demo:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current user (JWT-based)
  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      company: req.user.company,
      role: req.user.role,
    });
  });

  // Replit Auth routes (existing)
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

  // Folder management routes
  app.get("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folders = await storage.getFolders(userId);
      res.json(folders);
    } catch (error) {
      console.error("Error fetching folders:", error);
      res.status(500).json({ message: "Error al obtener carpetas" });
    }
  });

  app.post("/api/folders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertFolderSchema.parse({
        ...req.body,
        userId,
      });
      
      const folder = await storage.createFolder(validatedData);
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating folder:", error);
      res.status(500).json({ message: "Error al crear carpeta" });
    }
  });

  app.put("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.id);
      const validatedData = insertFolderSchema.partial().parse(req.body);
      
      const folder = await storage.updateFolder(folderId, userId, validatedData);
      if (!folder) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }
      
      res.json(folder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error updating folder:", error);
      res.status(500).json({ message: "Error al actualizar carpeta" });
    }
  });

  app.delete("/api/folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.id);
      
      const success = await storage.deleteFolder(folderId, userId);
      if (!success) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }
      
      res.json({ message: "Carpeta eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ message: "Error al eliminar carpeta" });
    }
  });

  app.get("/api/folders/:id/certifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.id);
      
      const result = await storage.getFolderWithCertifications(folderId, userId);
      if (!result) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching folder with certifications:", error);
      res.status(500).json({ message: "Error al obtener carpeta y certificaciones" });
    }
  });

  app.put("/api/certifications/:id/move", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificationId = parseInt(req.params.id);
      const { folderId } = req.body;
      
      const certification = await storage.moveCertificationToFolder(certificationId, folderId, userId);
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      console.error("Error moving certification:", error);
      res.status(500).json({ message: "Error al mover certificación" });
    }
  });

  // Get all certifications with optional status filter
  app.get("/api/certifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.query;
      
      let certifications;
      if (status === 'archived') {
        certifications = await storage.getCertificationsByStatus(userId, 'archived');
      } else {
        // Default: show non-archived certifications
        certifications = await storage.getCertificationsByUserExcludingArchived(userId);
      }
      
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
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

  // Public pricing rates endpoint (no authentication required)
  app.get("/api/pricing-rates/public", async (req, res) => {
    try {
      const rates = await storage.getPublicPricingRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching public pricing rates:", error);
      res.status(500).json({ message: "Error al obtener tarifas públicas" });
    }
  });

  // Generate public pricing link
  app.post("/api/pricing-rates/public-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const publicLink = `${baseUrl}/generador-presupuesto`;
      
      res.json({ publicLink });
    } catch (error) {
      console.error("Error generating public link:", error);
      res.status(500).json({ message: "Error al generar enlace público" });
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
          const quote = await storage.updateQuoteRequest(uniqueLink, {
            status: 'paid',
            paidAt: new Date(),
          });

          // Create notification for payment received
          if (quote && quote.userId) {
            await notificationService.notifyPaymentReceived(
              quote.userId,
              quote.clientName || 'Cliente',
              paymentIntent.amount / 100, // Convert from cents
              parseInt(paymentIntent.id)
            );
          }

          // Trigger automatic certification form sending via WhatsApp
          if (quote && quote.whatsappConversationId) {
            await sendCertificationFormToClient(quote);
          }
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error handling stripe webhook:", error);
      res.status(500).json({ message: "Error al procesar webhook" });
    }
  });

  // WhatsApp Business configuration routes
  app.post("/api/whatsapp/configure", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const config = req.body;
      
      const user = await storage.updateWhatsAppConfig(userId, config);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({ message: "Configuración de WhatsApp actualizada", user });
    } catch (error) {
      console.error("Error updating WhatsApp config:", error);
      res.status(500).json({ message: "Error al configurar WhatsApp" });
    }
  });

  app.get("/api/whatsapp/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      res.json({
        integrationActive: user.whatsappIntegrationActive || false,
        phoneNumberId: user.whatsappPhoneNumberId,
        businessAccountId: user.whatsappBusinessAccountId
      });
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
      res.status(500).json({ message: "Error al obtener estado de WhatsApp" });
    }
  });

  app.get("/api/whatsapp/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getWhatsAppConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Error al obtener conversaciones" });
    }
  });

  // WhatsApp webhook for receiving messages
  app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const body = req.body;

      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === "messages") {
              const messages = change.value.messages;
              const metadata = change.value.metadata;

              for (const message of messages || []) {
                await handleIncomingWhatsAppMessage(message, metadata);
              }
            }
          }
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error handling WhatsApp webhook:", error);
      res.status(500).json({ message: "Error al procesar webhook de WhatsApp" });
    }
  });

  // Public certification form routes
  app.get("/api/public/certification-form/:uniqueLink", async (req, res) => {
    try {
      const { uniqueLink } = req.params;
      
      // Find quote by link to get delivery days and other info
      const quote = await storage.getQuoteByLink(uniqueLink);
      
      if (!quote || quote.status !== 'paid') {
        return res.status(404).json({ message: "Formulario no encontrado o pago no confirmado" });
      }
      
      res.json({
        deliveryDays: quote.deliveryDays,
        clientName: quote.clientName,
        propertyType: quote.propertyType
      });
    } catch (error) {
      console.error("Error fetching certification form:", error);
      res.status(500).json({ message: "Error al obtener formulario" });
    }
  });

  app.post("/api/public/certification-form/:uniqueLink", async (req, res) => {
    try {
      const { uniqueLink } = req.params;
      const formData = req.body;
      
      const quote = await storage.getQuoteByLink(uniqueLink);
      
      if (!quote || quote.status !== 'paid') {
        return res.status(404).json({ message: "Formulario no encontrado o pago no confirmado" });
      }
      
      // Create certification from form data
      const certificationData = {
        userId: quote.userId,
        dni: formData.dni,
        fullName: formData.fullName,
        cadastralRef: formData.cadastralRef,
        phone: formData.phone,
        email: formData.email,
        habitableFloors: formData.habitableFloors,
        rooms: formData.rooms,
        facadeOrientation: formData.facadeOrientation,
        windowDetails: formData.windowDetails,
        roofType: formData.roofType,
        airConditioningSystem: formData.airConditioningSystem,
        heatingSystem: formData.heatingSystem,
        waterHeatingType: formData.waterHeatingType,
        waterHeatingCapacity: formData.waterHeatingCapacity,
        photos: formData.photos || [],
        status: 'in_progress'
      };
      
      const certification = await storage.createCertification(certificationData);
      
      // Create notification for new certification
      await notificationService.notifyNewCertification(
        quote.userId,
        formData.fullName,
        formData.cadastralRef,
        certification.id
      );
      
      // Update quote status
      await storage.updateQuoteRequest(uniqueLink, {
        status: 'certification_started'
      });
      
      // Update WhatsApp conversation state
      if (quote.whatsappConversationId) {
        await storage.updateConversationState(
          parseInt(quote.whatsappConversationId), 
          'certification_form_completed'
        );
        
        // Send confirmation message
        await sendCertificationConfirmation(quote, certification);
      }
      
      res.json({ 
        message: "Formulario enviado correctamente",
        certificationId: certification.id
      });
    } catch (error) {
      console.error("Error processing certification form:", error);
      res.status(500).json({ message: "Error al procesar formulario" });
    }
  });

  // Archive certification endpoint
  app.post("/api/certifications/:id/archive", isAuthenticated, async (req, res) => {
    try {
      const certificationId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get certification to verify ownership
      const certification = await storage.getCertification(certificationId, userId);
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }

      // Create folder for the client if it doesn't exist
      const folderName = `${certification.ownerName} - ${certification.cadastralRef}`;
      const existingFolder = await storage.getFolderByName(userId, folderName);
      
      let folderId;
      if (existingFolder) {
        folderId = existingFolder.id;
      } else {
        const newFolder = await storage.createFolder({
          userId,
          name: folderName,
          description: `Carpeta de certificación para ${certification.ownerName}`,
          color: '#10B981' // Green color for archived certificates
        });
        folderId = newFolder.id;
      }

      // Update certification status to archived and assign to folder
      await storage.updateCertification(certificationId, userId, {
        status: 'archived',
        folderId: folderId
      });

      res.json({ 
        message: "Certificación archivada correctamente",
        folderId,
        folderName
      });
    } catch (error) {
      console.error("Error archiving certification:", error);
      res.status(500).json({ message: "Error al archivar certificación" });
    }
  });

  // Delete certification endpoint
  app.delete("/api/certifications/:id", isAuthenticated, async (req, res) => {
    try {
      const certificationId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      // Get certification to verify ownership
      const certification = await storage.getCertification(certificationId, userId);
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }

      // Delete certification permanently
      await storage.deleteCertification(certificationId, userId);

      res.json({ message: "Certificación eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ message: "Error al eliminar certificación" });
    }
  });

  // Update certification status endpoint
  app.patch("/api/certifications/:id/status", isAuthenticated, async (req, res) => {
    try {
      const certificationId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!status) {
        return res.status(400).json({ message: "Estado requerido" });
      }

      // Get certification to verify ownership
      const certification = await storage.getCertification(certificationId, userId);
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }

      // If status is "finalizado", auto-archive with folder creation
      if (status === "finalizado") {
        // Create folder for the client if it doesn't exist
        const folderName = `${certification.ownerName} - ${certification.cadastralRef}`;
        const existingFolder = await storage.getFolderByName(userId, folderName);
        
        let folderId;
        if (existingFolder) {
          folderId = existingFolder.id;
        } else {
          const newFolder = await storage.createFolder({
            userId,
            name: folderName,
            description: `Carpeta de certificación para ${certification.ownerName}`,
            color: '#10B981' // Green color for archived certificates
          });
          folderId = newFolder.id;
        }

        // Update certification status to archived and assign to folder
        const updatedCertification = await storage.updateCertification(certificationId, userId, {
          status: 'archived',
          folderId: folderId
        });

        res.json({ 
          message: "Certificación finalizada y archivada correctamente",
          certification: updatedCertification,
          folderId,
          folderName
        });
      } else {
        // Regular status update
        const updatedCertification = await storage.updateCertification(certificationId, userId, {
          status: status
        });

        res.json({ message: "Estado actualizado correctamente", certification: updatedCertification });
      }
    } catch (error) {
      console.error("Error updating certification status:", error);
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  });

  // Upload final certificate to folder endpoint
  app.post("/api/folders/:folderId/upload-certificate", isAuthenticated, upload.single('certificate'), async (req, res) => {
    try {
      const folderId = parseInt(req.params.folderId);
      const userId = req.user?.claims?.sub;

      if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Archivo requerido" });
      }

      // Verify folder ownership
      const folder = await storage.getFolder(folderId, userId);
      if (!folder) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }

      // Store certificate information
      const certificate = await storage.createUploadedCertificate({
        userId,
        folderId,
        fileName: req.file.filename,
        originalFileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        clientName: folder.name
      });

      res.json({ 
        message: "Certificado subido correctamente",
        certificate
      });
    } catch (error) {
      console.error("Error uploading certificate:", error);
      res.status(500).json({ message: "Error al subir certificado" });
    }
  });

  // WhatsApp messaging functions
  async function sendCertificationFormToClient(quote: any) {
    try {
      const user = await storage.getUser(quote.userId);
      if (!user || !user.whatsappBusinessToken) return;

      const formLink = `${process.env.BASE_URL || 'https://localhost:3000'}/certificacion-cliente/${quote.uniqueLink}`;
      
      const message = {
        messaging_product: "whatsapp",
        to: quote.clientPhone,
        type: "template",
        template: {
          name: "certification_form",
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: quote.clientName || "Cliente" },
                { type: "text", text: formLink }
              ]
            }
          ]
        }
      };

      await sendWhatsAppMessage(user.whatsappBusinessToken, user.whatsappPhoneNumberId, message);
      
      // Log message
      if (quote.whatsappConversationId) {
        await storage.logWhatsAppMessage({
          conversationId: parseInt(quote.whatsappConversationId),
          messageId: `cert_form_${Date.now()}`,
          direction: 'outbound',
          messageType: 'template',
          content: `Formulario de certificación enviado: ${formLink}`
        });
      }
    } catch (error) {
      console.error("Error sending certification form:", error);
    }
  }

  async function sendCertificationConfirmation(quote: any, certification: any) {
    try {
      const user = await storage.getUser(quote.userId);
      if (!user || !user.whatsappBusinessToken) return;

      const message = {
        messaging_product: "whatsapp",
        to: quote.clientPhone,
        type: "text",
        text: {
          body: `¡Perfecto! Hemos recibido toda la información de tu certificación energética.\n\n📋 Número de certificación: #${certification.id}\n⏱️ Tiempo estimado: ${quote.deliveryDays} días laborables\n\nTe mantendremos informado del progreso. ¡Gracias por confiar en nosotros!`
        }
      };

      await sendWhatsAppMessage(user.whatsappBusinessToken, user.whatsappPhoneNumberId, message);
    } catch (error) {
      console.error("Error sending confirmation:", error);
    }
  }

  async function handleIncomingWhatsAppMessage(message: any, metadata: any) {
    try {
      const phoneNumberId = metadata.phone_number_id;
      const from = message.from;
      
      // Find user by phone number ID
      const users = await storage.getUserByWhatsAppPhone(phoneNumberId);
      if (!users.length) return;
      
      const user = users[0];
      
      // Get or create conversation
      let conversation = await storage.getConversationByPhone(user.id, from);
      
      if (!conversation) {
        conversation = await storage.createWhatsAppConversation({
          userId: user.id,
          clientPhone: from,
          conversationState: 'initial'
        });
      }
      
      // Log incoming message
      await storage.logWhatsAppMessage({
        conversationId: conversation.id,
        messageId: message.id,
        direction: 'inbound',
        messageType: message.type,
        content: message.text?.body || message.type
      });
      
      // Handle conversation flow
      await handleConversationFlow(conversation, message, user);
      
    } catch (error) {
      console.error("Error handling incoming message:", error);
    }
  }

  async function handleConversationFlow(conversation: any, message: any, user: any) {
    // Implementation of automated conversation flow
    // This would handle the different states and send appropriate responses
  }

  async function sendWhatsAppMessage(token: string, phoneNumberId: string, message: any) {
    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  // Public API routes (no authentication required)
  
  // Get public pricing rates
  app.get("/api/public/pricing-rates", async (req, res) => {
    try {
      // For now, we'll get rates from the first available user
      // In a real scenario, you might want to implement a system where
      // each certificador has their own public URL
      const rates = await storage.getPublicPricingRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching public pricing rates:", error);
      res.status(500).json({ message: "Error al obtener tarifas" });
    }
  });

  // Create public quote request
  app.post("/api/public/quote-request", async (req, res) => {
    try {
      const validatedData = insertQuoteRequestSchema.parse(req.body);
      
      // For now, assign to the first available user
      // In production, you'd implement proper routing logic
      const defaultUserId = "42776088"; // This should be dynamic
      
      const result = await storage.createQuoteRequest(defaultUserId);
      
      // Update the quote with the provided data
      const updatedQuote = await storage.updateQuoteRequest(result.uniqueLink, {
        ...validatedData,
        status: 'pending'
      });

      res.json({
        ...updatedQuote,
        uniqueLink: result.uniqueLink
      });
    } catch (error) {
      console.error("Error creating public quote request:", error);
      res.status(500).json({ message: "Error al crear solicitud de presupuesto" });
    }
  });

  // Process payment for public quote
  app.post("/api/process-payment", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe no está configurado" });
      }

      const { paymentMethodId, quoteId, amount } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: 'eur',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: {
          quoteId: quoteId.toString()
        }
      });

      if (paymentIntent.status === 'succeeded') {
        // Update quote status to paid
        // You'll need to implement a method to find quote by ID
        res.json({ success: true, paymentIntent });
      } else {
        res.status(400).json({ message: "El pago no se pudo completar" });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Error al procesar el pago" });
    }
  });

  // Create sample pricing data (for testing purposes)
  app.post("/api/create-sample-pricing", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const sampleRates = [
        {
          userId,
          propertyType: "vivienda",
          location: "zona_urbana",
          basePrice: "180",
          pricePerM2: "2.50",
          ruralSurchargePercentage: "15",
          displacementCostPerKm: "0.45",
          includeDisplacement: true,
          urgentServicePrice: "50",
          urgentServiceAvailable: true,
          photographyServicePrice: "40",
          photographyServiceAvailable: true,
          additionalMeasurementsPrice: "30",
          additionalMeasurementsAvailable: true,
          advancePercentage: 50,
          deliveryDays: 7,
          description: "Certificación energética para viviendas en zona urbana",
          isActive: true
        },
        {
          userId,
          propertyType: "vivienda",
          location: "zona_rural",
          basePrice: "180",
          pricePerM2: "2.50",
          ruralSurchargePercentage: "20",
          displacementCostPerKm: "0.45",
          includeDisplacement: true,
          urgentServicePrice: "60",
          urgentServiceAvailable: true,
          photographyServicePrice: "50",
          photographyServiceAvailable: true,
          additionalMeasurementsPrice: "40",
          additionalMeasurementsAvailable: true,
          advancePercentage: 50,
          deliveryDays: 7,
          description: "Certificación energética para viviendas en zona rural",
          isActive: true
        },
        {
          userId,
          propertyType: "local_comercial",
          location: "zona_urbana",
          basePrice: "220",
          pricePerM2: "3.00",
          ruralSurchargePercentage: "15",
          displacementCostPerKm: "0.45",
          includeDisplacement: true,
          urgentServicePrice: "60",
          urgentServiceAvailable: true,
          photographyServicePrice: "50",
          photographyServiceAvailable: true,
          additionalMeasurementsPrice: "40",
          additionalMeasurementsAvailable: true,
          advancePercentage: 50,
          deliveryDays: 10,
          description: "Certificación energética para locales comerciales en zona urbana",
          isActive: true
        }
      ];

      for (const rate of sampleRates) {
        await storage.createPricingRate(rate);
      }

      res.json({ message: "Datos de muestra creados correctamente", count: sampleRates.length });
    } catch (error) {
      console.error("Error creating sample pricing:", error);
      res.status(500).json({ message: "Error al crear datos de muestra" });
    }
  });

  // Manager Financial Records API Route - Combined invoices and collections data
  app.get('/api/manager/financial-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { searchType, paymentMethodFilter, invoiceStatusFilter, dateFrom, dateTo } = req.query;
      
      const records = await storage.getManagerFinancialRecords(userId, {
        searchType: searchType as string,
        paymentMethodFilter: paymentMethodFilter as string,
        invoiceStatusFilter: invoiceStatusFilter as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string
      });
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching manager financial records:", error);
      res.status(500).json({ message: "Error al obtener registros financieros" });
    }
  });

  // Create invoice from collection (cash payments without invoices)
  app.post('/api/collections/:id/create-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collectionId = parseInt(req.params.id);
      
      const invoice = await storage.createInvoiceFromCollection(collectionId, userId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Cobro no encontrado o no válido para facturación" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice from collection:", error);
      res.status(500).json({ message: "Error al crear factura desde cobro" });
    }
  });

  // Delete collection (only for cash payments without invoices)
  app.delete('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collectionId = parseInt(req.params.id);
      
      const success = await storage.deleteCollection(collectionId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Cobro no encontrado o no se puede eliminar" });
      }
      
      res.json({ message: "Cobro eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Error al eliminar cobro" });
    }
  });

  // WhatsApp Flow Templates API Routes
  app.get('/api/whatsapp/flow-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getWhatsappFlowTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching flow templates:", error);
      res.status(500).json({ message: "Error al obtener plantillas de flujo" });
    }
  });

  app.get('/api/whatsapp/flow-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const template = await storage.getWhatsappFlowTemplate(id, userId);
      if (!template) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching flow template:", error);
      res.status(500).json({ message: "Error al obtener plantilla" });
    }
  });

  app.post('/api/whatsapp/flow-templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWhatsappFlowTemplateSchema.parse({
        ...req.body,
        userId,
      });
      
      const template = await storage.createWhatsappFlowTemplate(validatedData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating flow template:", error);
      res.status(500).json({ message: "Error al crear plantilla de flujo" });
    }
  });

  app.patch('/api/whatsapp/flow-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = insertWhatsappFlowTemplateSchema.partial().parse(req.body);
      
      const template = await storage.updateWhatsappFlowTemplate(id, userId, validatedData);
      
      if (!template) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error updating flow template:", error);
      res.status(500).json({ message: "Error al actualizar plantilla" });
    }
  });

  app.delete('/api/whatsapp/flow-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteWhatsappFlowTemplate(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Plantilla no encontrada" });
      }
      
      res.json({ message: "Plantilla eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting flow template:", error);
      res.status(500).json({ message: "Error al eliminar plantilla" });
    }
  });

  app.get('/api/whatsapp/active-flow-template', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.getActiveWhatsappFlowTemplate(userId);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching active flow template:", error);
      res.status(500).json({ message: "Error al obtener plantilla activa" });
    }
  });

  // Notifications API Routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await notificationService.getAllNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Test notification endpoint for demonstration
  app.post('/api/notifications/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type } = req.body;

      switch (type) {
        case 'new_certification':
          await notificationService.notifyNewCertification(
            userId,
            'Juan Pérez',
            '1234567890123',
            999
          );
          break;
        case 'payment_received':
          await notificationService.notifyPaymentReceived(
            userId,
            'María García',
            450,
            888
          );
          break;
        case 'certificate_expiring':
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          await notificationService.notifyCertificateExpiring(
            userId,
            'Carlos López',
            '9876543210987',
            expirationDate.toLocaleDateString('es-ES')
          );
          break;
        case 'quote_request':
          await notificationService.notifyQuoteRequest(
            userId,
            'Ana Martínez',
            '5555555555555',
            777
          );
          break;
        default:
          return res.status(400).json({ message: 'Invalid notification type' });
      }

      res.json({ message: 'Test notification created successfully' });
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({ message: "Failed to create test notification" });
    }
  });

  app.get('/api/notifications/unread', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await notificationService.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.get('/api/notifications/count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = parseInt(req.params.id);
      
      await notificationService.markAsRead(notificationId, userId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await notificationService.markAllAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Financial Management API Routes
  app.get('/api/financial/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateRange } = req.query;
      const summary = await storage.getFinancialSummary(userId, dateRange);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      res.status(500).json({ message: "Failed to fetch financial summary" });
    }
  });

  // Invoice Management Routes
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateRange, paymentStatus } = req.query;
      const invoices = await storage.getInvoices(userId, dateRange, paymentStatus);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const invoice = await storage.getInvoice(id, userId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoice = await storage.createInvoice({ ...req.body, userId });
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.patch('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const invoice = await storage.updateInvoice(id, userId, req.body);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteInvoice(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  app.post('/api/invoices/:id/generate-pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const pdfUrl = await storage.generateInvoicePdf(id, userId);
      res.json({ downloadUrl: pdfUrl, filename: `invoice-${id}.pdf` });
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.post('/api/invoices/:id/send-email', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const sent = await storage.sendInvoiceEmail(id, userId);
      res.json({ success: sent });
    } catch (error) {
      console.error("Error sending invoice email:", error);
      res.status(500).json({ message: "Failed to send invoice email" });
    }
  });

  // Convert proforma invoice to regular invoice
  app.post('/api/invoices/:id/convert-to-invoice', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const invoice = await storage.convertProformaToInvoice(id, userId);
      res.json(invoice);
    } catch (error) {
      console.error("Error converting proforma to invoice:", error);
      res.status(500).json({ message: "Error al convertir factura proforma" });
    }
  });

  // Register invoice in accounting (for cash payments)
  app.post('/api/invoices/:id/register-accounting', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const invoice = await storage.registerInvoiceInAccounting(id, userId);
      res.json(invoice);
    } catch (error) {
      console.error("Error registering invoice in accounting:", error);
      res.status(500).json({ message: "Error al registrar en contabilidad" });
    }
  });

  // Payment Management Routes
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateRange } = req.query;
      const payments = await storage.getPayments(userId, dateRange);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get('/api/invoices/:id/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      const payments = await storage.getPaymentsByInvoice(invoiceId, userId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const payment = await storage.recordPayment({ ...req.body, userId });
      res.json(payment);
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  });

  // Collections Management Routes
  app.get('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { dateRange, paymentMethod } = req.query;
      const collections = await storage.getCollections(userId, dateRange, paymentMethod);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Error al obtener cobros" });
    }
  });

  app.get('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id, userId);
      if (!collection) {
        return res.status(404).json({ message: "Cobro no encontrado" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Error al obtener cobro" });
    }
  });

  app.post('/api/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collection = await storage.createCollection({ ...req.body, userId });
      res.json(collection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ message: "Error al crear cobro" });
    }
  });

  app.patch('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const collection = await storage.updateCollection(id, userId, req.body);
      if (!collection) {
        return res.status(404).json({ message: "Cobro no encontrado" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error updating collection:", error);
      res.status(500).json({ message: "Error al actualizar cobro" });
    }
  });

  app.delete('/api/collections/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollection(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Cobro no encontrado" });
      }
      res.json({ message: "Cobro eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Error al eliminar cobro" });
    }
  });

  // Invoice payment routes
  app.get('/api/invoices/:id/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      const collections = await storage.getInvoiceCollections(invoiceId, userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching invoice collections:", error);
      res.status(500).json({ message: "Error al obtener cobros de factura" });
    }
  });

  app.post('/api/invoices/:id/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      const collection = await storage.recordInvoicePayment(invoiceId, { ...req.body, userId });
      res.json(collection);
    } catch (error) {
      console.error("Error recording invoice payment:", error);
      res.status(500).json({ message: "Error al registrar pago de factura" });
    }
  });

  // Certification Reports API - Generate downloadable technical reports
  app.get('/api/certifications/:id/report/:format', isAuthenticated, async (req: any, res) => {
    try {
      const { id, format } = req.params;
      const userId = req.user.claims.sub;
      const certificationId = parseInt(id);

      if (!certificationId || isNaN(certificationId)) {
        return res.status(400).json({ message: 'ID de certificación inválido' });
      }

      // Verify certification belongs to user
      const certification = await storage.getCertification(certificationId, userId);
      if (!certification) {
        return res.status(404).json({ message: 'Certificación no encontrada' });
      }

      let buffer: Buffer;
      let contentType: string;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];
      const baseName = `certificacion_${certification.id}_${timestamp}`;

      switch (format.toLowerCase()) {
        case 'pdf':
          buffer = await reportGenerator.generatePDFReport(certificationId, userId);
          contentType = 'application/pdf';
          filename = `${baseName}.pdf`;
          break;
        
        case 'word':
        case 'docx':
          buffer = await reportGenerator.generateWordReport(certificationId, userId);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = `${baseName}.docx`;
          break;
        
        case 'excel':
        case 'xlsx':
          buffer = await reportGenerator.generateExcelReport(certificationId, userId);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = `${baseName}.xlsx`;
          break;
        
        default:
          return res.status(400).json({ message: 'Formato no soportado. Use: pdf, word, excel' });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ message: 'Error al generar el reporte' });
    }
  });

  // Uploaded certificates endpoints
  app.get("/api/uploaded-certificates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = req.query.folderId ? parseInt(req.query.folderId) : undefined;
      const certificates = await storage.getUploadedCertificates(userId, folderId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching uploaded certificates:", error);
      res.status(500).json({ message: "Failed to fetch uploaded certificates" });
    }
  });

  app.get("/api/uploaded-certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificateId = parseInt(req.params.id);
      const certificate = await storage.getUploadedCertificate(certificateId, userId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching uploaded certificate:", error);
      res.status(500).json({ message: "Failed to fetch uploaded certificate" });
    }
  });

  app.post("/api/uploaded-certificates", isAuthenticated, upload.single('certificate'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { clientName, clientEmail, clientPhone, folderId, certificationId, description, tags } = req.body;

      if (!clientName) {
        return res.status(400).json({ message: "Client name is required" });
      }

      const certificateData = {
        userId,
        certificationId: certificationId ? parseInt(certificationId) : null,
        folderId: folderId ? parseInt(folderId) : null,
        fileName: file.filename,
        originalFileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        description: description || null,
        tags: tags ? JSON.parse(tags) : null,
        sentViaEmail: false,
        sentViaWhatsapp: false
      };

      const certificate = await storage.createUploadedCertificate(certificateData);
      res.status(201).json(certificate);
    } catch (error) {
      console.error("Error creating uploaded certificate:", error);
      res.status(500).json({ message: "Failed to upload certificate" });
    }
  });

  app.patch("/api/uploaded-certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificateId = parseInt(req.params.id);
      const updates = req.body;
      
      const certificate = await storage.updateUploadedCertificate(certificateId, userId, updates);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error updating uploaded certificate:", error);
      res.status(500).json({ message: "Failed to update certificate" });
    }
  });

  app.delete("/api/uploaded-certificates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificateId = parseInt(req.params.id);
      
      const success = await storage.deleteUploadedCertificate(certificateId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      res.json({ message: "Certificate deleted successfully" });
    } catch (error) {
      console.error("Error deleting uploaded certificate:", error);
      res.status(500).json({ message: "Failed to delete certificate" });
    }
  });

  app.post("/api/uploaded-certificates/:id/send-email", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificateId = parseInt(req.params.id);
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }
      
      const success = await storage.sendCertificateViaEmail(certificateId, userId, recipientEmail);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found or failed to send" });
      }
      
      res.json({ message: "Certificate sent via email successfully" });
    } catch (error) {
      console.error("Error sending certificate via email:", error);
      res.status(500).json({ message: "Failed to send certificate via email" });
    }
  });

  app.post("/api/uploaded-certificates/:id/send-whatsapp", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const certificateId = parseInt(req.params.id);
      const { recipientPhone } = req.body;
      
      if (!recipientPhone) {
        return res.status(400).json({ message: "Recipient phone is required" });
      }
      
      const success = await storage.sendCertificateViaWhatsApp(certificateId, userId, recipientPhone);
      
      if (!success) {
        return res.status(404).json({ message: "Certificate not found or failed to send" });
      }
      
      res.json({ message: "Certificate sent via WhatsApp successfully" });
    } catch (error) {
      console.error("Error sending certificate via WhatsApp:", error);
      res.status(500).json({ message: "Failed to send certificate via WhatsApp" });
    }
  });

  // Client folder management endpoints
  
  // Get folder documents
  app.get("/api/folders/:folderId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      
      const documents = await storage.getFolderDocuments(folderId, userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching folder documents:", error);
      res.status(500).json({ message: "Error al obtener documentos" });
    }
  });

  // Get certification data for folder
  app.get("/api/folders/:folderId/certification", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      
      const certification = await storage.getCertificationByFolderId(folderId, userId);
      res.json(certification);
    } catch (error) {
      console.error("Error fetching certification data:", error);
      res.status(500).json({ message: "Error al obtener datos de certificación" });
    }
  });

  // Upload documents to folder
  app.post("/api/folders/:folderId/upload", isAuthenticated, upload.array('files', 10), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      const { category = 'document', description = '' } = req.body;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No se subieron archivos" });
      }

      const uploadedDocuments = [];
      
      for (const file of req.files) {
        const document = await storage.createFolderDocument({
          userId,
          folderId,
          fileName: file.filename,
          originalName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          fileType: file.mimetype,
          category,
          description
        });
        uploadedDocuments.push(document);
      }
      
      res.json({
        message: "Archivos subidos correctamente",
        documents: uploadedDocuments
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ message: "Error al subir archivos" });
    }
  });

  // Download document
  app.get("/api/folders/:folderId/documents/:documentId/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      const documentId = parseInt(req.params.documentId);
      
      const document = await storage.getFolderDocument(documentId, folderId, userId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      res.download(document.filePath, document.originalName);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Error al descargar documento" });
    }
  });

  // View document (for images/PDFs)
  app.get("/api/folders/:folderId/documents/:documentId/view", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      const documentId = parseInt(req.params.documentId);
      
      const document = await storage.getFolderDocument(documentId, folderId, userId);
      if (!document) {
        return res.status(404).json({ message: "Documento no encontrado" });
      }

      res.setHeader('Content-Type', document.fileType);
      res.sendFile(path.resolve(document.filePath));
    } catch (error) {
      console.error("Error viewing document:", error);
      res.status(500).json({ message: "Error al visualizar documento" });
    }
  });

  // Delete document
  app.delete("/api/folders/:folderId/documents/:documentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      const documentId = parseInt(req.params.documentId);
      
      await storage.deleteFolderDocument(documentId, folderId, userId);
      res.json({ message: "Documento eliminado correctamente" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Error al eliminar documento" });
    }
  });

  // Serve uploaded photos from certification forms
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), "uploads", filename);
    
    // Check if file exists
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
  });

  // Ship certificate to client
  app.post("/api/folders/:folderId/ship-certificate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const folderId = parseInt(req.params.folderId);
      const { method, paymentRequired, message } = req.body;

      // Get folder and certification data
      const folder = await storage.getFolder(folderId, userId);
      if (!folder) {
        return res.status(404).json({ message: "Carpeta no encontrada" });
      }

      const certification = await storage.getFolderCertification(folderId, userId);
      if (!certification) {
        return res.status(404).json({ message: "Certificación no encontrada" });
      }

      // Create shipping record and handle the delivery
      let deliveryResult;
      
      if (method === 'email') {
        if (paymentRequired) {
          // Generate payment link and send email with payment requirement
          deliveryResult = await handleEmailWithPayment(certification, message);
        } else {
          // Send certificate directly via email
          deliveryResult = await handleDirectEmail(certification, message);
        }
      } else if (method === 'whatsapp') {
        if (paymentRequired) {
          // Send WhatsApp message with payment link
          deliveryResult = await handleWhatsAppWithPayment(certification, message);
        } else {
          // Send certificate directly via WhatsApp
          deliveryResult = await handleDirectWhatsApp(certification, message);
        }
      } else if (method === 'direct') {
        // Create delivery record for direct/manual delivery
        deliveryResult = await handleDirectDelivery(certification, paymentRequired, message);
      }

      res.json({ 
        message: "Certificado enviado correctamente",
        deliveryMethod: method,
        paymentRequired,
        result: deliveryResult
      });
    } catch (error) {
      console.error("Error shipping certificate:", error);
      res.status(500).json({ message: "Error al enviar certificado" });
    }
  });

  // Helper functions for certificate delivery
  async function handleEmailWithPayment(certification: any, message: string) {
    // Generate payment link (would integrate with Stripe)
    const paymentLink = `${process.env.BASE_URL}/pay/${certification.id}`;
    
    // Send email with payment link
    const emailContent = `
      Estimado/a ${certification.ownerName},
      
      Su certificado energético está listo para la descarga. Para obtenerlo, por favor complete el pago pendiente:
      
      ${paymentLink}
      
      ${message ? `\nNota adicional: ${message}` : ''}
      
      Una vez completado el pago, recibirá su certificado inmediatamente.
      
      Saludos cordiales
    `;
    
    // Here would integrate with email service (SendGrid, etc.)
    console.log(`Email sent to ${certification.email} with payment link`);
    
    return { type: 'email_with_payment', paymentLink, sent: true };
  }

  async function handleDirectEmail(certification: any, message: string) {
    const emailContent = `
      Estimado/a ${certification.ownerName},
      
      Adjuntamos su certificado energético solicitado.
      
      ${message ? `\nNota adicional: ${message}` : ''}
      
      Saludos cordiales
    `;
    
    // Here would attach the certificate file and send email
    console.log(`Certificate emailed directly to ${certification.email}`);
    
    return { type: 'direct_email', sent: true };
  }

  async function handleWhatsAppWithPayment(certification: any, message: string) {
    const paymentLink = `${process.env.BASE_URL}/pay/${certification.id}`;
    
    const whatsappMessage = `¡Hola ${certification.ownerName}! 🏠
    
Su certificado energético está listo. Para descargarlo, complete el pago aquí: ${paymentLink}

${message ? `\n📝 ${message}` : ''}

Una vez pagado, recibirá su certificado inmediatamente.`;
    
    // Here would integrate with WhatsApp Business API
    console.log(`WhatsApp sent to ${certification.phone} with payment link`);
    
    return { type: 'whatsapp_with_payment', paymentLink, sent: true };
  }

  async function handleDirectWhatsApp(certification: any, message: string) {
    const whatsappMessage = `¡Hola ${certification.ownerName}! 🏠
    
Su certificado energético está listo y adjunto en este mensaje.

${message ? `\n📝 ${message}` : ''}

¡Gracias por confiar en nosotros!`;
    
    // Here would send WhatsApp with certificate attachment
    console.log(`Certificate sent via WhatsApp to ${certification.phone}`);
    
    return { type: 'direct_whatsapp', sent: true };
  }

  async function handleDirectDelivery(certification: any, paymentRequired: boolean, message: string) {
    // Create delivery record for manual/direct delivery tracking
    const deliveryRecord = {
      certificationId: certification.id,
      deliveryMethod: 'direct',
      paymentRequired,
      message,
      status: 'pending',
      createdAt: new Date()
    };
    
    console.log(`Direct delivery prepared for ${certification.ownerName}`);
    
    return { type: 'direct_delivery', paymentRequired, prepared: true };
  }

  const httpServer = createServer(app);
  return httpServer;
}
