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
        fullName: formData.fullName,
        address: formData.address,
        cadastralRef: formData.cadastralRef,
        propertyType: formData.propertyType,
        buildYear: formData.buildYear,
        totalArea: formData.totalArea,
        heatedArea: formData.heatedArea || formData.totalArea,
        floors: formData.floors,
        rooms: formData.rooms,
        bathrooms: formData.bathrooms,
        heatingSystem: formData.heatingSystem,
        coolingSystem: formData.coolingSystem,
        dhwSystem: formData.dhwSystem,
        photos: formData.photos || [],
        observations: formData.observations,
        status: 'in_progress'
      };
      
      const certification = await storage.createCertification(certificationData);
      
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
          basePrice: "350",
          advancePercentage: 50,
          deliveryDays: 7,
          description: "Certificación energética para viviendas unifamiliares",
          isActive: true
        },
        {
          userId,
          propertyType: "local",
          basePrice: "450",
          advancePercentage: 50,
          deliveryDays: 10,
          description: "Certificación energética para locales comerciales",
          isActive: true
        },
        {
          userId,
          propertyType: "oficina",
          basePrice: "400",
          advancePercentage: 50,
          deliveryDays: 8,
          description: "Certificación energética para oficinas",
          isActive: true
        },
        {
          userId,
          propertyType: "nave",
          basePrice: "600",
          advancePercentage: 50,
          deliveryDays: 15,
          description: "Certificación energética para naves industriales",
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

  const httpServer = createServer(app);
  return httpServer;
}
