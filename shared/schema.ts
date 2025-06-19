import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - Enhanced for local authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  license: varchar("license"),
  phone: varchar("phone"),
  address: text("address"),
  dni: varchar("dni"), // DNI/NIF for legal invoicing
  role: varchar("role").default("user"), // user, admin, demo
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  resetToken: varchar("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  lastLogin: timestamp("last_login"),
  trialExpiresAt: timestamp("trial_expires_at"),
  stripeAccountId: varchar("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  // WhatsApp Business integration
  whatsappBusinessToken: varchar("whatsapp_business_token"),
  whatsappPhoneNumberId: varchar("whatsapp_phone_number_id"),
  whatsappBusinessAccountId: varchar("whatsapp_business_account_id"),
  whatsappWebhookVerifyToken: varchar("whatsapp_webhook_verify_token"),
  whatsappIntegrationActive: boolean("whatsapp_integration_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Demo account requests
export const demoRequests = pgTable("demo_requests", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  company: varchar("company"),
  phone: varchar("phone"),
  message: text("message"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by"),
});

// Folders for organizing certificates by client
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  color: varchar("color").default("#6366f1"), // Default color for folders
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certifications table - based on official CEE form requirements
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),
  
  // Propiedad - Property Information
  propertyAddress: text("property_address").notNull(), // PROPIEDAD: Dirección completa
  
  // Datos del titular - Owner Information
  ownerName: varchar("owner_name").notNull(), // NOMBRE TITULAR
  ownerDni: varchar("owner_dni").notNull(), // DNI/NIE
  cadastralRef: varchar("cadastral_ref").notNull(), // REFERENCIA CATASTRAL
  phone: varchar("phone"), // TELÉFONO
  email: varchar("email"), // EMAIL
  
  // Estructura del edificio - Building Structure
  buildingFloors: integer("building_floors"), // Nº DE PLANTAS HABITABLES DEL EDIFICIO (Sin contar sótano)
  propertyFloors: integer("property_floors"), // Plantas que corresponden a la vivienda
  rooms: integer("rooms"), // Nº DE HABITACIONES (ESTANCIAS)
  
  // Orientación de fachadas - Facade Orientation
  facadeNorthwest: boolean("facade_northwest").default(false), // NOROESTE
  facadeSoutheast: boolean("facade_southeast").default(false), // SURESTE  
  facadeEast: boolean("facade_east").default(false), // ESTE
  facadeWest: boolean("facade_west").default(false), // OESTE
  
  // Distribución de ventanas por fachada - Window Distribution by Facade
  windowsNorthwest: text("windows_northwest"), // Descripción ventanas orientación noroeste
  windowsSoutheast: text("windows_southeast"), // Descripción ventanas orientación sureste
  windowsEast: text("windows_east"), // Descripción ventanas orientación este
  windowsWest: text("windows_west"), // Descripción ventanas orientación oeste
  
  // Detalles de ventanas - Window Details
  windowType: varchar("window_type"), // TIPO DE VENTANA (Cuadrada, rectangular, redonda)
  windowMaterial: varchar("window_material"), // MATERIAL VENTANAS (Aluminio, PVC, etc.)
  windowColor: varchar("window_color"), // Color del material
  glassType: varchar("glass_type"), // TIPO DE VIDRIO (Simple, doble, etc.)
  windowLocation: text("window_location"), // INDICAR A DONDE DA (descripción vistas)
  hasShutters: boolean("has_shutters").default(false), // TIENEN PERSIANAS
  shutterType: varchar("shutter_type"), // Tipo de persianas/contraventanas
  
  // Tipo de cubierta - Roof Type
  roofType: varchar("roof_type"), // TIPO DE CUBIERTAS (Plana/Inclinada)
  
  // Equipos de climatización - Air Conditioning Equipment
  airConditioningType: varchar("air_conditioning_type"), // Split/por conductos
  airConditioningRooms: text("air_conditioning_rooms"), // Estancias climatizadas
  
  // Equipos de calefacción - Heating Equipment
  heatingType: varchar("heating_type"), // Radiadores, chimenea, etc.
  heatingDescription: text("heating_description"), // Descripción detallada del sistema
  
  // Calentador - Water Heater
  waterHeaterType: varchar("water_heater_type"), // Gas ciudad, butano, eléctrico
  waterHeaterCapacity: integer("water_heater_capacity"), // Capacidad en litros si eléctrico
  
  // Energy calculations (assigned by certificator)
  energyRating: varchar("energy_rating", { length: 1 }),
  energyConsumption: decimal("energy_consumption", { precision: 10, scale: 2 }),
  co2Emissions: decimal("co2_emissions", { precision: 10, scale: 2 }),
  
  // Status and metadata
  status: varchar("status").notNull().default("draft"), // draft, in_progress, completed
  photos: jsonb("photos"), // Array of photo URLs including facade photos
  certificateUrl: varchar("certificate_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  userId: true,
  energyRating: true,
  energyConsumption: true,
  co2Emissions: true,
  certificateUrl: true,
  createdAt: true,
  updatedAt: true,
});

export const updateCertificationSchema = insertCertificationSchema.partial();



// Pricing rates table
export const pricingRates = pgTable("pricing_rates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  propertyType: varchar("property_type").notNull(), // Vivienda, Local Comercial, Duplex, Chalet, Edificio completo
  location: varchar("location").notNull(), // Zona Urbana, Zona Rural
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  pricePerM2: decimal("price_per_m2", { precision: 10, scale: 2 }).notNull().default("0"),
  
  // Location-based pricing
  ruralSurchargePercentage: decimal("rural_surcharge_percentage", { precision: 5, scale: 2 }).notNull().default("15"),
  
  // Displacement costs
  displacementCostPerKm: decimal("displacement_cost_per_km", { precision: 10, scale: 2 }).notNull().default("0.45"),
  includeDisplacement: boolean("include_displacement").notNull().default(true),
  
  // Optional services - configurable prices and availability
  urgentServicePrice: decimal("urgent_service_price", { precision: 10, scale: 2 }).notNull().default("0"),
  urgentServiceAvailable: boolean("urgent_service_available").notNull().default(true),
  
  photographyServicePrice: decimal("photography_service_price", { precision: 10, scale: 2 }).notNull().default("0"),
  photographyServiceAvailable: boolean("photography_service_available").notNull().default(true),
  
  additionalMeasurementsPrice: decimal("additional_measurements_price", { precision: 10, scale: 2 }).notNull().default("0"),
  additionalMeasurementsAvailable: boolean("additional_measurements_available").notNull().default(true),
  
  // Business settings
  advancePercentage: integer("advance_percentage").notNull().default(50),
  deliveryDays: integer("delivery_days").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quote requests table
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // certificador
  uniqueLink: varchar("unique_link").notNull().unique(),
  
  // Client data
  clientName: varchar("client_name"),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  
  // Property data
  propertyType: varchar("property_type"),
  address: text("address"),
  floors: integer("floors"),
  rooms: integer("rooms"),
  area: decimal("area", { precision: 10, scale: 2 }),
  buildYear: integer("build_year"),
  additionalInfo: text("additional_info"),
  
  // Quote data
  basePrice: decimal("base_price", { precision: 10, scale: 2 }),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }),
  deliveryDays: integer("delivery_days"),
  
  // Status and payments
  status: varchar("status").notNull().default("pending"), // pending, quoted, accepted, paid, completed
  acceptedAt: timestamp("accepted_at"),
  paidAt: timestamp("paid_at"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  
  // WhatsApp integration
  whatsappConversationId: varchar("whatsapp_conversation_id"),
  sentViaWhatsapp: boolean("sent_via_whatsapp").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp conversations table
export const whatsappConversations = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // El certificador
  clientPhone: varchar("client_phone").notNull(), // Teléfono del cliente
  conversationState: varchar("conversation_state").notNull().default("initial"), // initial, awaiting_quote, quote_sent, paid, certification_form_sent, completed
  currentQuoteId: integer("current_quote_id").references(() => quoteRequests.id),
  currentCertificationId: integer("current_certification_id").references(() => certifications.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp messages log
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => whatsappConversations.id),
  messageId: varchar("message_id").notNull(), // WhatsApp message ID
  direction: varchar("direction").notNull(), // inbound, outbound
  messageType: varchar("message_type").notNull(), // text, image, document, template
  content: text("content"),
  metadata: jsonb("metadata"), // Para datos adicionales del mensaje
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial Management Tables
export const invoices: any = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  certificationId: integer("certification_id").references(() => certifications.id),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id),
  
  // Invoice identification
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  series: varchar("series").default("CERT"), // Serie de facturación
  
  // Invoice type
  invoiceType: varchar("invoice_type").default("invoice").notNull(), // invoice, proforma
  isProforma: boolean("is_proforma").default(false),
  
  // Accounting control
  isAccountingRegistered: boolean("is_accounting_registered").default(false),
  accountingRegisteredAt: timestamp("accounting_registered_at"),
  accountingRegisteredBy: varchar("accounting_registered_by").references(() => users.id),
  manualAccountingRequired: boolean("manual_accounting_required").default(false), // Para cobros en efectivo
  
  // Professional/Company information (automatically populated from user profile)
  professionalName: varchar("professional_name").notNull(), // From user firstName + lastName
  professionalDni: varchar("professional_dni").notNull(), // From user DNI field
  professionalEmail: varchar("professional_email").notNull(), // From user email
  professionalPhone: varchar("professional_phone"), // From user phone
  professionalAddress: text("professional_address"), // From user address
  professionalCompany: varchar("professional_company"), // From user company
  professionalLicense: varchar("professional_license"), // From user license
  
  // Client information
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  clientAddress: text("client_address"),
  clientNif: varchar("client_nif"), // NIF/CIF del cliente
  clientCity: varchar("client_city"),
  clientPostalCode: varchar("client_postal_code"),
  
  // Financial details
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("21.00"), // IVA español
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  irpfRate: decimal("irpf_rate", { precision: 5, scale: 2 }).default("0.00"), // Retención IRPF
  irpfAmount: decimal("irpf_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Payment details
  paymentStatus: varchar("payment_status").default("pending"), // pending, paid, partial, overdue, cancelled
  paymentMethod: varchar("payment_method"), // transfer, stripe, cash, check
  paymentTerms: integer("payment_terms").default(30), // días de pago
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Invoice content
  description: text("description").notNull(),
  lineItems: jsonb("line_items"), // Líneas de factura detalladas
  notes: text("notes"),
  
  // Dates
  issueDate: timestamp("issue_date").defaultNow(),
  serviceDate: timestamp("service_date"), // Fecha del servicio
  
  // File management
  pdfUrl: varchar("pdf_url"),
  sentDate: timestamp("sent_date"),
  sentCount: integer("sent_count").default(0),
  
  // Legal compliance
  isRectification: boolean("is_rectification").default(false),
  originalInvoiceId: integer("original_invoice_id").references(() => invoices.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method").notNull(), // transfer, stripe, cash, check
  paymentReference: varchar("payment_reference"), // Número de transferencia, ID transacción
  paymentDate: timestamp("payment_date").defaultNow(),
  
  // Accounting control
  isAccountingRegistered: boolean("is_accounting_registered").default(false),
  accountingRegisteredAt: timestamp("accounting_registered_at"),
  accountingRegisteredBy: varchar("accounting_registered_by").references(() => users.id),
  requiresManualAccounting: boolean("requires_manual_accounting").default(false), // Para cobros en efectivo
  
  // Bank details for transfers
  bankAccount: varchar("bank_account"),
  bankName: varchar("bank_name"),
  
  // Stripe integration
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  stripeChargeId: varchar("stripe_charge_id"),
  
  notes: text("notes"),
  status: varchar("status").default("completed"), // completed, pending, failed, refunded
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Basic collection information
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  concept: text("concept").notNull(), // Concepto del cobro
  paymentMethod: varchar("payment_method").notNull(), // cash, card, bizum, transfer, stripe, other
  paymentReference: varchar("payment_reference"), // Referencia de la transacción
  collectionDate: timestamp("collection_date").notNull(),
  
  // Accounting control
  isAccountingRegistered: boolean("is_accounting_registered").default(false),
  accountingRegisteredAt: timestamp("accounting_registered_at"),
  accountingRegisteredBy: varchar("accounting_registered_by").references(() => users.id),
  requiresManualAccounting: boolean("requires_manual_accounting").default(false), // Para cobros en efectivo
  invoiceGenerated: boolean("invoice_generated").default(false),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  
  // Invoice relationship (optional)
  isInvoicePayment: boolean("is_invoice_payment").default(false),
  
  // Client information (for non-invoice collections)
  clientName: varchar("client_name"),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  
  // Payment details
  bankAccount: varchar("bank_account"), // Para transferencias
  cardLastFour: varchar("card_last_four"), // Últimos 4 dígitos de tarjeta
  stripePaymentId: varchar("stripe_payment_id"), // ID de pago de Stripe
  
  // Tax information
  vatIncluded: boolean("vat_included").default(true),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0.00"),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("21.00"),
  
  // Status and validation
  status: varchar("status").default("confirmed"), // confirmed, pending, cancelled
  verificationCode: varchar("verification_code"), // Para verificar el cobro
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Conversation Flow Templates
export const whatsappFlowTemplates = pgTable("whatsapp_flow_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Template identification
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Flow configuration
  welcomeMessage: text("welcome_message").notNull(),
  budgetCalculatorMessage: text("budget_calculator_message"),
  budgetCalculatorLink: varchar("budget_calculator_link"),
  
  // FAQ responses
  faqResponses: jsonb("faq_responses"), // Array of {question, answer}
  
  // Service information
  serviceDescription: text("service_description"),
  servicePolicies: text("service_policies"),
  deliveryTimeInfo: text("delivery_time_info"),
  
  // Payment information
  paymentMethods: text("payment_methods"),
  paymentPolicies: text("payment_policies"),
  paymentLinks: jsonb("payment_links"), // Array of {name, url, description}
  
  // Contact and scheduling
  contactInfo: text("contact_info"),
  schedulingInfo: text("scheduling_info"),
  workingHours: text("working_hours"),
  
  // Automated responses
  fallbackMessage: text("fallback_message"), // When user message is not understood
  endConversationMessage: text("end_conversation_message"),
  
  // Flow triggers and keywords
  triggerKeywords: jsonb("trigger_keywords"), // Array of keywords that trigger specific responses
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uploaded certificates table for client folders
export const uploadedCertificates = pgTable("uploaded_certificates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  certificationId: integer("certification_id").references(() => certifications.id),
  folderId: integer("folder_id").references(() => folders.id),
  
  // File information
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  
  // Client information
  clientName: varchar("client_name").notNull(),
  clientEmail: varchar("client_email"),
  clientPhone: varchar("client_phone"),
  
  // Send status
  sentViaEmail: boolean("sent_via_email").default(false),
  emailSentAt: timestamp("email_sent_at"),
  sentViaWhatsapp: boolean("sent_via_whatsapp").default(false),
  whatsappSentAt: timestamp("whatsapp_sent_at"),
  
  // Metadata
  description: text("description"),
  tags: jsonb("tags"), // Array of tags for categorization
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPricingRateSchema = createInsertSchema(pricingRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWhatsappFlowTemplateSchema = createInsertSchema(whatsappFlowTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUploadedCertificateSchema = createInsertSchema(uploadedCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemoRequestSchema = createInsertSchema(demoRequests).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Notifications system
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'new_certification', 'payment_received', 'certificate_expiring', 'quote_request'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data related to the notification
  read: boolean("read").default(false),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type DemoRequest = typeof demoRequests.$inferSelect;
export type InsertDemoRequest = z.infer<typeof insertDemoRequestSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type UpdateCertification = z.infer<typeof updateCertificationSchema>;
export type PricingRate = typeof pricingRates.$inferSelect;
export type InsertPricingRate = z.infer<typeof insertPricingRateSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type WhatsappFlowTemplate = typeof whatsappFlowTemplates.$inferSelect;
export type InsertWhatsappFlowTemplate = z.infer<typeof insertWhatsappFlowTemplateSchema>;
export type UploadedCertificate = typeof uploadedCertificates.$inferSelect;
export type InsertUploadedCertificate = z.infer<typeof insertUploadedCertificateSchema>;
