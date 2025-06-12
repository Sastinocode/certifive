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

// Certifications table
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
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
  propertyType: varchar("property_type").notNull(), // vivienda, local_comercial, chalet, edificio_completo
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
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

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
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
