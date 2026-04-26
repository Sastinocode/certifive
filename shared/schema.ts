import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// USERS  (certificador / professional)
// ─────────────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"),
  phone: text("phone"),
  company: text("company"),
  licenseNumber: text("license_number"),
  dniNif: text("dni_nif"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  role: text("role").notNull().default("user"),   // "user" | "admin"
  replitId: text("replit_id").unique(),
  profileImageUrl: text("profile_image_url"),
  // Stripe customer
  stripeCustomerId: text("stripe_customer_id").unique(),
  // Email verification
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerificationToken: text("email_verification_token"),

  // ── Public profile ──────────────────────────────────────────────────────────
  publicSlug: text("public_slug").unique(),

  // ── Service settings ────────────────────────────────────────────────────────
  condicionesServicio: text("condiciones_servicio"),
  plazoEntregaDias: integer("plazo_entrega_dias").default(10),

  // ── Payment settings ────────────────────────────────────────────────────────
  bizumPhone: text("bizum_phone"),
  iban: text("iban"),
  enabledPaymentMethods: jsonb("enabled_payment_methods"),   // string[]
  tramo1Percent: integer("tramo1_percent").default(25),
  blockFormUntilPayment1: boolean("block_form_until_payment1").default(false).notNull(),
  blockCertificateUntilPayment2: boolean("block_certificate_until_payment2").default(false).notNull(),
  paymentReminderDays: integer("payment_reminder_days").default(3),

  // ── Profile media & identity ────────────────────────────────────────────────
  commercialName: text("commercial_name"),         // nombre comercial (if different from company)
  logoUrl: text("logo_url"),                       // certifier logo for documents
  firmaUrl: text("firma_url"),                     // digital signature image
  emailSignature: text("email_signature"),         // custom email footer

  // ── Invoice settings ────────────────────────────────────────────────────────
  invoiceSeriesPrefix: text("invoice_series_prefix").default("FAC"),
  invoiceNextNumber: integer("invoice_next_number").default(1),
  ivaPercent: decimal("iva_percent", { precision: 5, scale: 2 }).default("21"),

  // ── Notification preferences ─────────────────────────────────────────────────
  notifyFormCompleted: boolean("notify_form_completed").default(true).notNull(),
  notifyPaymentReceived: boolean("notify_payment_received").default(true).notNull(),
  notifyNewMessage: boolean("notify_new_message").default(true).notNull(),
  dailyDigestEnabled: boolean("daily_digest_enabled").default(false).notNull(),
  dailyDigestHour: integer("daily_digest_hour").default(8),

  // ── Onboarding ───────────────────────────────────────────────────────────────
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),

  // ── Account settings ────────────────────────────────────────────────────────
  timezone: text("timezone").default("Europe/Madrid"),

  // ── WhatsApp Business (360dialog) ───────────────────────────────────────────
  whatsappApiKey: text("whatsapp_api_key"),        // AES-256-CBC encrypted
  whatsappPhone: text("whatsapp_phone"),           // verified number e.g. +34600000000
  whatsappConnectedAt: timestamp("whatsapp_connected_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKENS
// ─────────────────────────────────────────────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("refresh_tokens_user_id_idx").on(t.userId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// FOLDERS  (organización de expedientes por cliente)
// ─────────────────────────────────────────────────────────────────────────────
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  clientName: text("client_name"),
  cadastralReference: text("cadastral_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("folders_user_id_idx").on(t.userId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATIONS  (el expediente CEE central)
//
// status values (kept as-is for backwards compat with frontend):
//   "Nuevo" | "En Proceso" | "Finalizado"
// isArchived = true  →  equivalent to "archivado"
// ─────────────────────────────────────────────────────────────────────────────
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),

  // Workflow status
  status: text("status").notNull().default("Nuevo"),   // "Nuevo" | "En Proceso" | "Finalizado"
  isArchived: boolean("is_archived").default(false).notNull(),
  archivedAt: timestamp("archived_at"),
  deliveryStatus: text("delivery_status"),

  // Owner (propietario del inmueble)
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  ownerDni: text("owner_dni"),

  // Property (inmueble)
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  cadastralReference: text("cadastral_reference"),
  propertyType: text("property_type"),
  constructionYear: integer("construction_year"),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }),
  energyRating: text("energy_rating"),              // A | B | C | D | E | F | G
  numPlantas: integer("num_plantas"),

  // ── Pricing ─────────────────────────────────────────────────────────────────
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false).notNull(),
  plazoEntregaDias: integer("plazo_entrega_dias"),
  tramo1Amount: decimal("tramo1_amount", { precision: 10, scale: 2 }),
  tramo2Amount: decimal("tramo2_amount", { precision: 10, scale: 2 }),
  tramo1PaidAt: timestamp("tramo1_paid_at"),
  tramo2PaidAt: timestamp("tramo2_paid_at"),

  // ── Free-form data ───────────────────────────────────────────────────────────
  formData: jsonb("form_data"),

  // ── SOLICITUD (Formulario 1 — tasación) ─────────────────────────────────────
  solicitudToken: text("solicitud_token").unique(),
  solicitudStatus: text("solicitud_status"),   // "enviado"|"abierto"|"completado"
  solicitudSentAt: timestamp("solicitud_sent_at"),
  solicitudOpenedAt: timestamp("solicitud_opened_at"),
  solicitudCompletedAt: timestamp("solicitud_completed_at"),

  // ── PRESUPUESTO ──────────────────────────────────────────────────────────────
  presupuestoToken: text("presupuesto_token").unique(),
  presupuestoStatus: text("presupuesto_status"),  // "enviado"|"aceptado"|"modificacion_solicitada"
  presupuestoSentAt: timestamp("presupuesto_sent_at"),
  presupuestoAceptadoAt: timestamp("presupuesto_aceptado_at"),
  modificacionSolicitada: boolean("modificacion_solicitada").default(false),
  modificacionMotivo: text("modificacion_motivo"),

  // ── PAYMENT TOKEN (public payment page) ─────────────────────────────────────
  paymentToken: text("payment_token").unique(),

  // ── FORMULARIO CEE completo (Formulario 2) ───────────────────────────────────
  ceeToken: text("cee_token").unique(),
  ceeFormStatus: text("cee_form_status"),   // "enviado"|"abierto"|"completado"
  ceeFormSentAt: timestamp("cee_form_sent_at"),
  ceeFormOpenedAt: timestamp("cee_form_opened_at"),
  ceeFormCompletedAt: timestamp("cee_form_completed_at"),

  // ── Overall pipeline status ──────────────────────────────────────────────────
  workflowStatus: text("workflow_status").default("nuevo"),

  // ── Legacy simple form (backward compat) ────────────────────────────────────
  formToken: text("form_token").unique(),
  formStatus: text("form_status"),
  formSentAt: timestamp("form_sent_at"),
  formOpenedAt: timestamp("form_opened_at"),
  formCompletedAt: timestamp("form_completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("certifications_user_id_idx").on(t.userId),
  index("certifications_folder_id_idx").on(t.folderId),
  index("certifications_status_idx").on(t.status),
  index("certifications_workflow_idx").on(t.workflowStatus),
  uniqueIndex("certifications_form_token_idx").on(t.formToken),
  uniqueIndex("certifications_solicitud_token_idx").on(t.solicitudToken),
  uniqueIndex("certifications_presupuesto_token_idx").on(t.presupuestoToken),
  uniqueIndex("certifications_payment_token_idx").on(t.paymentToken),
  uniqueIndex("certifications_cee_token_idx").on(t.ceeToken),
]);

// ─────────────────────────────────────────────────────────────────────────────
// FORM RESPONSES  (snapshot de cada envío del propietario)
//
// Keeps an immutable audit trail of what the owner submitted.
// The data is also merged into certifications fields, but this table
// lets you see the raw submission and supports re-submissions.
// ─────────────────────────────────────────────────────────────────────────────
export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id")
    .references(() => certifications.id, { onDelete: "cascade" })
    .notNull(),

  // Step 1 — owner identity
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  ownerDni: text("owner_dni"),

  // Step 2 — property
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  propertyType: text("property_type"),
  constructionYear: integer("construction_year"),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }),
  cadastralReference: text("cadastral_reference"),

  // Step 3 — energy (answers to plain-language questions)
  energyData: jsonb("energy_data"),   // { heating, hotWater, cooling, windows, insulation }

  // Full raw body for forensics
  rawData: jsonb("raw_data"),

  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("form_responses_certification_id_idx").on(t.certificationId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS  (archivos subidos por cliente o certificador)
// ─────────────────────────────────────────────────────────────────────────────
export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id")
    .references(() => certifications.id, { onDelete: "cascade" })
    .notNull(),

  nombreOriginal: text("nombre_original").notNull(),
  nombreArchivo: text("nombre_archivo").notNull(),
  path: text("path").notNull(),
  mimeType: text("mime_type"),
  tamano: integer("tamano"),

  // "factura_luz"|"factura_gas"|"referencia_catastral"|"planos"|"certificado"|"otro"
  tipoDoc: text("tipo_doc").notNull().default("otro"),
  // "cliente" | "certificador"
  subidoPor: text("subido_por").notNull().default("cliente"),
  // "pendiente" | "revisado" | "rechazado"
  estadoRevision: text("estado_revision").default("pendiente").notNull(),
  motivoRechazo: text("motivo_rechazo"),

  fechaSubida: timestamp("fecha_subida").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("documentos_certification_id_idx").on(t.certificationId),
  index("documentos_subido_por_idx").on(t.subidoPor),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PRICING RATES  (tarifas del certificador por tipo de inmueble)
// ─────────────────────────────────────────────────────────────────────────────
export const pricingRates = pgTable("pricing_rates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  propertyType: text("property_type").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  // [{maxArea: 100, multiplier: 1.0}, {maxArea: 200, multiplier: 1.2}, {maxArea: null, multiplier: 1.5}]
  areaTiers: jsonb("area_tiers"),
  // {"madrid": 10, "barcelona": 15} — % surcharge per province slug
  provinceSurcharges: jsonb("province_surcharges"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("pricing_rates_user_id_idx").on(t.userId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE REQUESTS  (presupuestos enviados a clientes)
// ─────────────────────────────────────────────────────────────────────────────
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  certificationId: integer("certification_id").references(() => certifications.id, { onDelete: "set null" }),

  // Client
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),

  // Property info at quote time
  propertyType: text("property_type"),
  address: text("address"),

  // Pricing
  amount: decimal("amount", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("21"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),

  // Status: "pending" | "sent" | "accepted" | "rejected" | "expired"
  status: text("status").default("pending").notNull(),

  notes: text("notes"),
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  acceptedAt: timestamp("accepted_at"),

  // Legacy Stripe field (keep for backwards compat)
  stripePaymentId: text("stripe_payment_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("quote_requests_user_id_idx").on(t.userId),
  index("quote_requests_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES  (facturas emitidas)
// ─────────────────────────────────────────────────────────────────────────────
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  certificationId: integer("certification_id").references(() => certifications.id, { onDelete: "set null" }),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id, { onDelete: "set null" }),

  invoiceNumber: text("invoice_number").unique(),

  // Client snapshot at invoice time
  clientName: text("client_name"),
  clientDni: text("client_dni"),
  clientAddress: text("client_address"),
  clientEmail: text("client_email"),

  // Amounts
  amount: decimal("amount", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("21"),
  tax: decimal("tax", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),

  // Status: "draft" | "issued" | "paid" | "overdue" | "cancelled"
  status: text("status").default("draft").notNull(),

  notes: text("notes"),
  issuedAt: timestamp("issued_at"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("invoices_user_id_idx").on(t.userId),
  index("invoices_certification_id_idx").on(t.certificationId),
  index("invoices_status_idx").on(t.status),
]);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS  (transacciones Stripe procesadas)
// ─────────────────────────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  certificationId: integer("certification_id").references(() => certifications.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id, { onDelete: "set null" }),

  // Stripe
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeChargeId: text("stripe_charge_id"),

  // Amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("eur").notNull(),

  // Status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled"
  status: text("status").default("pending").notNull(),

  description: text("description"),
  metadata: jsonb("metadata"),
  errorMessage: text("error_message"),

  // ── Payment classification ───────────────────────────────────────────────────
  tramo: integer("tramo"),          // 1 or 2
  metodo: text("metodo"),           // "stripe"|"bizum"|"transferencia"|"efectivo"

  // ── Manual confirmation flow ─────────────────────────────────────────────────
  // "pendiente_confirmacion" | "confirmado" | "rechazado"
  estadoConfirmacion: text("estado_confirmacion").default("pendiente_confirmacion"),
  fechaNotificacion: timestamp("fecha_notificacion"),
  fechaConfirmacion: timestamp("fecha_confirmacion"),
  confirmadoPor: integer("confirmado_por").references(() => users.id, { onDelete: "set null" }),
  notas: text("notas"),

  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("payments_user_id_idx").on(t.userId),
  index("payments_certification_id_idx").on(t.certificationId),
  index("payments_invoice_id_idx").on(t.invoiceId),
  index("payments_status_idx").on(t.status),
  index("payments_estado_confirmacion_idx").on(t.estadoConfirmacion),
  uniqueIndex("payments_stripe_payment_intent_id_idx").on(t.stripePaymentIntentId),
]);

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS  (express-session store — do not modify structure)
// ─────────────────────────────────────────────────────────────────────────────
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// ─────────────────────────────────────────────────────────────────────────────
// PLANTILLAS WHATSAPP  (custom message templates per certifier)
// ─────────────────────────────────────────────────────────────────────────────
export const plantillasWhatsapp = pgTable("plantillas_whatsapp", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tipoMensaje: integer("tipo_mensaje").notNull(),   // 1–8
  contenido: text("contenido").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("plantillas_whatsapp_user_id_idx").on(t.userId),
  uniqueIndex("plantillas_whatsapp_user_tipo_idx").on(t.userId, t.tipoMensaje),
]);

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJES COMUNICACION  (audit log of all sent messages per certification)
// canal: "whatsapp" | "email"
// tipo_mensaje: "1"–"8" | "manual"
// estado: "enviado" | "entregado" | "leido" | "fallido"
// ─────────────────────────────────────────────────────────────────────────────
export const mensajesComunicacion = pgTable("mensajes_comunicacion", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id")
    .references(() => certifications.id, { onDelete: "cascade" })
    .notNull(),
  canal: text("canal").notNull().default("email"),
  tipoMensaje: text("tipo_mensaje"),
  contenido: text("contenido"),
  estado: text("estado").notNull().default("enviado"),
  fechaEnvio: timestamp("fecha_envio").defaultNow().notNull(),
  fechaEntrega: timestamp("fecha_entrega"),
  fechaLectura: timestamp("fecha_lectura"),
  errorDetalle: text("error_detalle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("mensajes_comunicacion_cert_id_idx").on(t.certificationId),
  index("mensajes_comunicacion_canal_idx").on(t.canal),
  index("mensajes_comunicacion_estado_idx").on(t.estado),
]);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICACIONES  (in-app notifications for the certifier)
//
// tipo values:
//   "solicitud_completada" | "presupuesto_aceptado" | "pago_recibido"
//   "pago_fallido" | "cee_completado" | "recordatorio_formulario"
// ─────────────────────────────────────────────────────────────────────────────
export const notificaciones = pgTable("notificaciones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  certificationId: integer("certification_id")
    .references(() => certifications.id, { onDelete: "set null" }),
  tipo: text("tipo").notNull(),
  mensaje: text("mensaje").notNull(),
  leida: boolean("leida").default(false).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("notificaciones_user_id_idx").on(t.userId),
  index("notificaciones_user_leida_idx").on(t.userId, t.leida),
  index("notificaciones_created_at_idx").on(t.createdAt),
]);

// ─────────────────────────────────────────────────────────────────────────────
// BETA LEADS  (landing page registrations)
// ─────────────────────────────────────────────────────────────────────────────
export const betaLeads = pgTable("beta_leads", {
  id:                    serial("id").primaryKey(),
  nombre:                text("nombre").notNull(),
  email:                 text("email").notNull(),
  telefono:              text("telefono"),
  provincia:             text("provincia"),
  certificacionesMes:    integer("certificaciones_mes"),
  createdAt:             timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("beta_leads_email_idx").on(t.email),
  index("beta_leads_created_at_idx").on(t.createdAt),
]);

export type BetaLead = typeof betaLeads.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// INSERT SCHEMAS (Zod validation for API endpoints)
// ─────────────────────────────────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertPricingRateSchema = createInsertSchema(pricingRates).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertFormResponseSchema = createInsertSchema(formResponses).omit({
  id: true, createdAt: true, submittedAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertDocumentoSchema = createInsertSchema(documentos).omit({
  id: true, createdAt: true, fechaSubida: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type PricingRate = typeof pricingRates.$inferSelect;
export type InsertPricingRate = z.infer<typeof insertPricingRateSchema>;

export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;

export type PlantillaWhatsapp = typeof plantillasWhatsapp.$inferSelect;
export type MensajeComunicacion = typeof mensajesComunicacion.$inferSelect;
export type Notificacion = typeof notificaciones.$inferSelect;

export type PlantillaWhatsapp = typeof plantillasWhatsapp.$inferSelect;
export type MensajeComunicacion = typeof mensajesComunicacion.$inferSelect;
