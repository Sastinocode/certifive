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

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  company: varchar("company"),
  license: varchar("license"),
  phone: varchar("phone"),
  address: text("address"),
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

// Certifications table
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  folderId: integer("folder_id").references(() => folders.id, { onDelete: "set null" }),
  
  // General data
  dni: varchar("dni").notNull(),
  fullName: varchar("full_name").notNull(),
  cadastralRef: varchar("cadastral_ref").notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  floors: integer("floors"),
  rooms: integer("rooms"),
  
  // Housing details
  facadeOrientation: text("facade_orientation"),
  roofType: varchar("roof_type"),
  windows: jsonb("windows"), // Array of window objects
  
  // Installations
  hvacSystem: varchar("hvac_system"),
  heatingSystem: varchar("heating_system"),
  waterHeatingType: varchar("water_heating_type"),
  waterHeatingCapacity: integer("water_heating_capacity"),
  
  // Energy calculations
  energyRating: varchar("energy_rating", { length: 1 }),
  energyConsumption: decimal("energy_consumption", { precision: 10, scale: 2 }),
  co2Emissions: decimal("co2_emissions", { precision: 10, scale: 2 }),
  
  // Status and metadata
  status: varchar("status").notNull().default("draft"), // draft, in_progress, completed
  photos: jsonb("photos"), // Array of photo URLs
  certificateUrl: varchar("certificate_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
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
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  certificationId: integer("certification_id").references(() => certifications.id),
  quoteRequestId: integer("quote_request_id").references(() => quoteRequests.id),
  
  // Invoice identification
  invoiceNumber: varchar("invoice_number").unique().notNull(),
  series: varchar("series").default("CERT"), // Serie de facturación
  
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
  
  // Invoice relationship (optional)
  invoiceId: integer("invoice_id").references(() => invoices.id),
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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
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
