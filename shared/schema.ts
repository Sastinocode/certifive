import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  role: text("role").notNull().default("user"),
  replitId: text("replit_id").unique(),
  profileImageUrl: text("profile_image_url"),
  emailVerifiedAt: timestamp("email_verified_at"),
  emailVerificationToken: text("email_verification_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  folderId: integer("folder_id").references(() => folders.id),
  status: text("status").notNull().default("Nuevo"),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"),
  ownerPhone: text("owner_phone"),
  ownerDni: text("owner_dni"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  province: text("province"),
  cadastralReference: text("cadastral_reference"),
  propertyType: text("property_type"),
  constructionYear: integer("construction_year"),
  totalArea: decimal("total_area"),
  energyRating: text("energy_rating"),
  formData: jsonb("form_data"),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  deliveryStatus: text("delivery_status"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  clientName: text("client_name"),
  cadastralReference: text("cadastral_reference"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pricingRates = pgTable("pricing_rates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  propertyType: text("property_type").notNull(),
  basePrice: decimal("base_price").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  propertyType: text("property_type"),
  address: text("address"),
  status: text("status").default("pending"),
  amount: decimal("amount"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  certificationId: integer("certification_id").references(() => certifications.id),
  invoiceNumber: text("invoice_number"),
  clientName: text("client_name"),
  clientDni: text("client_dni"),
  clientAddress: text("client_address"),
  amount: decimal("amount"),
  tax: decimal("tax"),
  totalAmount: decimal("total_amount"),
  status: text("status").default("pending"),
  issuedAt: timestamp("issued_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCertificationSchema = createInsertSchema(certifications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFolderSchema = createInsertSchema(folders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPricingRateSchema = createInsertSchema(pricingRates).omit({ id: true, createdAt: true });
export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type PricingRate = typeof pricingRates.$inferSelect;
export type InsertPricingRate = z.infer<typeof insertPricingRateSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
