import { Express } from "express";
import rateLimit from "express-rate-limit";
import { checkSubscription } from "../subscription-guard";
import { requireFeature } from "../plan-features";
import { registerNotificationRoutes } from "./notifications";
import { registerAuthRoutes } from "./auth";
import { registerCertificationRoutes } from "./certifications";
import { registerFolderRoutes } from "./folders";
import { registerPricingRoutes } from "./pricing";
import { registerInvoiceRoutes } from "./invoices";
import { registerPublicFormRoutes } from "./public-forms";
import { registerPaymentRoutes } from "./payments";
import { registerDocumentRoutes } from "./documents";
import { registerWhatsAppRoutes } from "./whatsapp";
import { registerSubscriptionRoutes } from "./subscription";
import { registerMiscRoutes } from "./misc";
import { registerFormularioTecnicoRoutes } from "./formulario-tecnico";
import { registerVisitFormRoutes } from "./visit-form";
import { registerExportCE3XRoutes } from "./export-ce3x";
import { registerDashboardRoutes } from "./dashboard";
import { registerAlertRoutes } from "./alerts";
import { registerCollaborationRoutes } from "./collaboration";
import { registerSearchRoutes } from "./search";
import { registerSolicitudesRoutes } from "./solicitudes";
import { registerAdminRoutes } from "./admin";

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas peticiones. Intenta de nuevo en 15 minutos." },
});

export function registerRoutes(app: Express) {
  app.use("/api", apiRateLimiter);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Subscription wall — runs before every /api route except the exempt list.
  // Authenticates the request and then verifies the user has an active or
  // trialing subscription; returns 403 SUBSCRIPTION_REQUIRED otherwise.
  app.use("/api", checkSubscription);

  // Feature gates — profesional+ only.
  // req.user is already populated by checkSubscription at this point.
  app.use("/api/whatsapp", requireFeature("whatsapp"));
  app.use("/api/invoices", requireFeature("invoicing"));
  app.use("/api/financial", requireFeature("reports"));
  app.use("/api/payments", requireFeature("reports"));
  app.use("/api/collections", requireFeature("reports"));
  app.use("/api/export", requireFeature("reports"));

  registerNotificationRoutes(app);
  registerAuthRoutes(app);
  registerCertificationRoutes(app);
  registerFolderRoutes(app);
  registerPricingRoutes(app);
  registerInvoiceRoutes(app);
  registerPublicFormRoutes(app);
  registerPaymentRoutes(app);
  registerDocumentRoutes(app);
  registerWhatsAppRoutes(app);
  registerSubscriptionRoutes(app);
  registerMiscRoutes(app);
  registerFormularioTecnicoRoutes(app);
  registerVisitFormRoutes(app);
  registerExportCE3XRoutes(app);
  registerDashboardRoutes(app);
  registerAlertRoutes(app);
  registerCollaborationRoutes(app);
  registerSearchRoutes(app);
  registerSolicitudesRoutes(app);
  registerAdminRoutes(app);
}
