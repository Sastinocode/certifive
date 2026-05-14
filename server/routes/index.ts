import { Express } from "express";
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

export function registerRoutes(app: Express) {
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

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
}
