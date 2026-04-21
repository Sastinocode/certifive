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

  // Pricing
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
  isPaid: boolean("is_paid").default(false).notNull(),

  // Free-form data (technical / energy detail from professional)
  formData: jsonb("form_data"),

  // Public owner form link
  formToken: text("form_token").unique(),
  formStatus: text("form_status"),    // "enviado" | "abierto" | "completado"
  formSentAt: timestamp("form_sent_at"),
  formOpenedAt: timestamp("form_opened_at"),
  formCompletedAt: timestamp("form_completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("certifications_user_id_idx").on(t.userId),
  index("certifications_folder_id_idx").on(t.folderId),
  index("certifications_status_idx").on(t.status),
  uniqueIndex("certifications_form_token_idx").on(t.formToken),
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
// PRICING RATES  (tarifas del certificador por tipo de inmueble)
// ─────────────────────────────────────────────────────────────────────────────
export const pricingRates = pgTable("pricing_rates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  propertyType: text("property_type").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
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
  metadata: jsonb("metadata"),    // arbitrary Stripe metadata or internal tags
  errorMessage: text("error_message"),

  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("payments_user_id_idx").on(t.userId),
  index("payments_certification_id_idx").on(t.certificationId),
  index("payments_invoice_id_idx").on(t.invoiceId),
  index("payments_status_idx").on(t.status),
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
