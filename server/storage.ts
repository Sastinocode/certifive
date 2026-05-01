import { 
  users, 
  folders,
  certifications,
  pricingRates,
  quoteRequests,
  whatsappConversations,
  whatsappMessages,
  whatsappFlowTemplates,
  invoices,
  payments,
  collections,
  demoRequests,
  uploadedCertificates,
  type User, 
  type UpsertUser,
  type Folder,
  type InsertFolder,
  type Certification,
  type InsertCertification,
  type UpdateCertification,
  type PricingRate,
  type InsertPricingRate,
  type QuoteRequest,
  type InsertQuoteRequest,
  type WhatsappConversation,
  type InsertWhatsappConversation,
  type WhatsappMessage,
  type InsertWhatsappMessage,
  type WhatsappFlowTemplate,
  type InsertWhatsappFlowTemplate,
  type Invoice,
  type InsertInvoice,
  type Payment,
  type InsertPayment,
  type Collection,
  type InsertCollection,
  type DemoRequest,
  type InsertDemoRequest,
  type UploadedCertificate,
  type InsertUploadedCertificate
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, desc, count, and, isNull, gte, lte, sql, ne } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Local authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserVerification(userId: string, isVerified: boolean): Promise<void>;
  
  // Demo request operations
  createDemoRequest(data: InsertDemoRequest): Promise<DemoRequest>;
  getDemoRequests(): Promise<DemoRequest[]>;
  updateDemoRequestStatus(id: number, status: string, processedBy?: string): Promise<void>;
  
  // Folder operations
  getFolders(userId: string): Promise<Folder[]>;
  getFolder(id: number, userId: string): Promise<Folder | undefined>;
  getFolderByName(userId: string, name: string): Promise<Folder | undefined>;
  createFolder(data: InsertFolder): Promise<Folder>;
  updateFolder(id: number, userId: string, data: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number, userId: string): Promise<boolean>;
  getFolderWithCertifications(id: number, userId: string): Promise<{ folder: Folder; certifications: Certification[] } | undefined>;
  
  // Certification operations
  getDashboardStats(userId: string): Promise<any>;
  getRecentCertifications(userId: string): Promise<any[]>;
  getCertificationsByUser(userId: string, folderId?: number | null): Promise<Certification[]>;
  getCertificationsByUserExcludingArchived(userId: string): Promise<Certification[]>;
  getCertificationsByStatus(userId: string, status: string): Promise<Certification[]>;
  getCertification(id: number, userId: string): Promise<Certification | undefined>;
  createCertification(data: InsertCertification): Promise<Certification>;
  updateCertification(id: number, userId: string, data: UpdateCertification): Promise<Certification | undefined>;
  addPhotos(id: number, userId: string, photos: string[]): Promise<Certification | undefined>;
  completeCertification(id: number, userId: string): Promise<Certification | undefined>;
  moveCertificationToFolder(certificationId: number, folderId: number | null, userId: string): Promise<Certification | undefined>;
  deleteCertification(id: number, userId: string): Promise<boolean>;
  
  // Pricing and quotes operations
  getPricingRates(userId: string): Promise<PricingRate[]>;
  getPublicPricingRates(): Promise<PricingRate[]>;
  createPricingRate(data: InsertPricingRate): Promise<PricingRate>;
  updatePricingRate(id: number, userId: string, data: Partial<InsertPricingRate>): Promise<PricingRate | undefined>;
  deletePricingRate(id: number, userId: string): Promise<boolean>;
  createQuoteRequest(userId: string): Promise<{ quoteRequest: QuoteRequest; uniqueLink: string }>;
  getQuoteByLink(uniqueLink: string): Promise<QuoteRequest | undefined>;
  updateQuoteRequest(uniqueLink: string, data: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined>;
  getQuotesByUser(userId: string): Promise<QuoteRequest[]>;
  updateUserStripeInfo(userId: string, stripeAccountId: string, onboardingComplete: boolean): Promise<User | undefined>;
  
  // WhatsApp Business operations
  updateWhatsAppConfig(userId: string, config: any): Promise<User | undefined>;
  getWhatsAppConversations(userId: string): Promise<WhatsappConversation[]>;
  createWhatsAppConversation(data: InsertWhatsappConversation): Promise<WhatsappConversation>;
  updateConversationState(conversationId: number, state: string, metadata?: any): Promise<WhatsappConversation | undefined>;
  getConversationByPhone(userId: string, clientPhone: string): Promise<WhatsappConversation | undefined>;
  logWhatsAppMessage(data: InsertWhatsappMessage): Promise<WhatsappMessage>;
  
  // WhatsApp Flow Templates operations
  getWhatsappFlowTemplates(userId: string): Promise<WhatsappFlowTemplate[]>;
  getWhatsappFlowTemplate(id: number, userId: string): Promise<WhatsappFlowTemplate | undefined>;
  createWhatsappFlowTemplate(data: InsertWhatsappFlowTemplate): Promise<WhatsappFlowTemplate>;
  updateWhatsappFlowTemplate(id: number, userId: string, data: Partial<InsertWhatsappFlowTemplate>): Promise<WhatsappFlowTemplate | undefined>;
  deleteWhatsappFlowTemplate(id: number, userId: string): Promise<boolean>;
  getActiveWhatsappFlowTemplate(userId: string): Promise<WhatsappFlowTemplate | undefined>;

  // Financial Management operations
  getFinancialSummary(userId: string, dateRange?: string): Promise<any>;
  
  // Invoice operations
  getInvoices(userId: string, dateRange?: string, paymentStatus?: string): Promise<any[]>;
  getInvoice(id: number, userId: string): Promise<any | undefined>;
  createInvoice(data: any): Promise<any>;
  updateInvoice(id: number, userId: string, data: any): Promise<any | undefined>;
  deleteInvoice(id: number, userId: string): Promise<boolean>;
  generateInvoicePdf(id: number, userId: string): Promise<string>;
  sendInvoiceEmail(id: number, userId: string): Promise<boolean>;
  
  // Payment operations
  getPayments(userId: string, dateRange?: string): Promise<any[]>;
  getPaymentsByInvoice(invoiceId: number, userId: string): Promise<any[]>;
  recordPayment(data: any): Promise<any>;
  
  // Collection operations
  getCollections(userId: string, dateRange?: string, paymentMethod?: string): Promise<Collection[]>;
  getCollection(id: number, userId: string): Promise<Collection | undefined>;
  createCollection(data: InsertCollection): Promise<Collection>;
  updateCollection(id: number, userId: string, data: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number, userId: string): Promise<boolean>;
  getInvoiceCollections(invoiceId: number, userId: string): Promise<Collection[]>;
  recordInvoicePayment(invoiceId: number, collectionData: InsertCollection): Promise<Collection>;
  
  // Manager financial records operations
  getManagerFinancialRecords(userId: string, filters: {
    searchType?: string;
    paymentMethodFilter?: string;
    invoiceStatusFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]>;
  createInvoiceFromCollection(collectionId: number, userId: string): Promise<Invoice | undefined>;
  
  // Uploaded certificates operations
  getUploadedCertificates(userId: string, folderId?: number): Promise<UploadedCertificate[]>;
  getUploadedCertificate(id: number, userId: string): Promise<UploadedCertificate | undefined>;
  createUploadedCertificate(data: InsertUploadedCertificate): Promise<UploadedCertificate>;
  updateUploadedCertificate(id: number, userId: string, data: Partial<InsertUploadedCertificate>): Promise<UploadedCertificate | undefined>;
  deleteUploadedCertificate(id: number, userId: string): Promise<boolean>;
  sendCertificateViaEmail(certificateId: number, userId: string, recipientEmail: string): Promise<boolean>;
  sendCertificateViaWhatsApp(certificateId: number, userId: string, recipientPhone: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Local authentication operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const userId = nanoid();
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        id: userId,
      })
      .returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserVerification(userId: string, isVerified: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isVerified, verificationToken: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Demo request operations
  async createDemoRequest(data: InsertDemoRequest): Promise<DemoRequest> {
    const [demoRequest] = await db.insert(demoRequests).values(data).returning();
    return demoRequest;
  }

  async getDemoRequests(): Promise<DemoRequest[]> {
    return await db.select().from(demoRequests).orderBy(desc(demoRequests.createdAt));
  }

  async updateDemoRequestStatus(id: number, status: string, processedBy?: string): Promise<void> {
    await db
      .update(demoRequests)
      .set({ 
        status, 
        processedBy, 
        processedAt: new Date() 
      })
      .where(eq(demoRequests.id, id));
  }

  // Folder operations
  async getFolders(userId: string): Promise<Folder[]> {
    return await db.select().from(folders).where(eq(folders.userId, userId)).orderBy(folders.name);
  }

  async getFolderByName(userId: string, name: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders)
      .where(and(eq(folders.userId, userId), eq(folders.name, name)));
    return folder;
  }

  async getFolder(id: number, userId: string): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return folder;
  }

  async createFolder(data: InsertFolder): Promise<Folder> {
    const [folder] = await db.insert(folders).values(data).returning();
    return folder;
  }

  async updateFolder(id: number, userId: string, data: Partial<InsertFolder>): Promise<Folder | undefined> {
    const [folder] = await db
      .update(folders)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return folder;
  }

  async deleteFolder(id: number, userId: string): Promise<boolean> {
    // First, move all certifications from this folder to "uncategorized" (null)
    await db
      .update(certifications)
      .set({ folderId: null })
      .where(and(eq(certifications.folderId, id), eq(certifications.userId, userId)));

    // Then delete the folder
    const result = await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getFolderWithCertifications(id: number, userId: string): Promise<{ folder: Folder; certifications: Certification[] } | undefined> {
    const folder = await this.getFolder(id, userId);
    if (!folder) return undefined;

    const certificationsList = await db
      .select()
      .from(certifications)
      .where(and(eq(certifications.folderId, id), eq(certifications.userId, userId)))
      .orderBy(desc(certifications.createdAt));

    return { folder, certifications: certificationsList };
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<any> {
    const [totalCerts] = await db
      .select({ count: count() })
      .from(certifications)
      .where(eq(certifications.userId, userId));

    const [completedCerts] = await db
      .select({ count: count() })
      .from(certifications)
      .where(and(
        eq(certifications.userId, userId),
        eq(certifications.status, 'completed')
      ));

    const [inProgressCerts] = await db
      .select({ count: count() })
      .from(certifications)
      .where(and(
        eq(certifications.userId, userId),
        eq(certifications.status, 'in_progress')
      ));

    // Calculate monthly income from all collections for now
    const allCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, userId));

    const monthlyIncome = allCollections.reduce((total, collection) => {
      return total + parseFloat(collection.amount);
    }, 0);

    return {
      activeCertificates: completedCerts?.count || 0,
      inProgress: inProgressCerts?.count || 0,
      expiringSoon: 0,
      monthlyIncome: monthlyIncome || 0
    };
  }

  async getRecentCertifications(userId: string): Promise<any[]> {
    const recentCerts = await db
      .select()
      .from(certifications)
      .where(eq(certifications.userId, userId))
      .orderBy(desc(certifications.createdAt))
      .limit(5);
    
    return recentCerts;
  }

  async getCertificationsByUser(userId: string, folderId?: number | null): Promise<Certification[]> {
    const conditions = [eq(certifications.userId, userId)];
    
    if (folderId !== undefined) {
      if (folderId === null) {
        // Get uncategorized certificates (no folder)
        conditions.push(isNull(certifications.folderId));
      } else {
        // Get certificates in specific folder
        conditions.push(eq(certifications.folderId, folderId));
      }
    }
    
    return await db
      .select()
      .from(certifications)
      .where(and(...conditions))
      .orderBy(desc(certifications.createdAt));
  }

  async getCertification(id: number, userId: string): Promise<Certification | undefined> {
    const [certification] = await db
      .select()
      .from(certifications)
      .where(and(
        eq(certifications.id, id),
        eq(certifications.userId, userId)
      ));
    
    return certification;
  }

  async createCertification(data: InsertCertification): Promise<Certification> {
    const [certification] = await db
      .insert(certifications)
      .values({
        ...data,
        status: 'draft'
      })
      .returning();
    
    return certification;
  }

  async updateCertification(id: number, userId: string, data: UpdateCertification): Promise<Certification | undefined> {
    const [certification] = await db
      .update(certifications)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(certifications.id, id),
        eq(certifications.userId, userId)
      ))
      .returning();
    
    return certification;
  }

  async addPhotos(id: number, userId: string, photos: string[]): Promise<Certification | undefined> {
    const [certification] = await db
      .update(certifications)
      .set({
        photos: photos,
        updatedAt: new Date()
      })
      .where(and(
        eq(certifications.id, id),
        eq(certifications.userId, userId)
      ))
      .returning();
    
    return certification;
  }

  async completeCertification(id: number, userId: string): Promise<Certification | undefined> {
    // In a real implementation, this would calculate energy ratings and generate the certificate
    const energyRating = this.calculateEnergyRating();
    const energyConsumption = Math.random() * 200 + 50; // Mock calculation
    const co2Emissions = energyConsumption * 0.3; // Mock calculation
    
    const [certification] = await db
      .update(certifications)
      .set({
        status: 'completed',
        energyRating,
        energyConsumption: energyConsumption.toString(),
        co2Emissions: co2Emissions.toString(),
        certificateUrl: `/certificates/${id}.pdf`,
        updatedAt: new Date()
      })
      .where(and(
        eq(certifications.id, id),
        eq(certifications.userId, userId)
      ))
      .returning();
    
    return certification;
  }

  async moveCertificationToFolder(certificationId: number, folderId: number | null, userId: string): Promise<Certification | undefined> {
    const [certification] = await db
      .update(certifications)
      .set({ folderId, updatedAt: new Date() })
      .where(and(
        eq(certifications.id, certificationId),
        eq(certifications.userId, userId)
      ))
      .returning();
    
    return certification;
  }

  async deleteCertification(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(certifications)
      .where(and(
        eq(certifications.id, id),
        eq(certifications.userId, userId)
      ));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getCertificationsByUserExcludingArchived(userId: string): Promise<Certification[]> {
    return await db
      .select()
      .from(certifications)
      .where(and(
        eq(certifications.userId, userId),
        sql`${certifications.status} != 'archived'`
      ));
  }

  async getCertificationsByStatus(userId: string, status: string): Promise<Certification[]> {
    return await db
      .select()
      .from(certifications)
      .where(and(
        eq(certifications.userId, userId),
        eq(certifications.status, status)
      ));
  }

  // Pricing rates operations
  async getPricingRates(userId: string): Promise<PricingRate[]> {
    return await db
      .select()
      .from(pricingRates)
      .where(eq(pricingRates.userId, userId))
      .orderBy(desc(pricingRates.createdAt));
  }

  async getPublicPricingRates(): Promise<PricingRate[]> {
    // Get active pricing rates from all users for public access
    return await db
      .select()
      .from(pricingRates)
      .where(eq(pricingRates.isActive, true))
      .orderBy(desc(pricingRates.createdAt));
  }

  async createPricingRate(data: InsertPricingRate): Promise<PricingRate> {
    const [rate] = await db
      .insert(pricingRates)
      .values(data)
      .returning();
    return rate;
  }

  async updatePricingRate(id: number, userId: string, data: Partial<InsertPricingRate>): Promise<PricingRate | undefined> {
    const [rate] = await db
      .update(pricingRates)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(and(
        eq(pricingRates.id, id),
        eq(pricingRates.userId, userId)
      ))
      .returning();
    
    return rate;
  }

  async deletePricingRate(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(pricingRates)
      .where(and(
        eq(pricingRates.id, id),
        eq(pricingRates.userId, userId)
      ));
    
    return (result.rowCount || 0) > 0;
  }

  // Quote requests operations
  async createQuoteRequest(userId: string): Promise<{ quoteRequest: QuoteRequest; uniqueLink: string }> {
    const uniqueLink = nanoid(12);
    
    const [quoteRequest] = await db
      .insert(quoteRequests)
      .values({
        userId,
        uniqueLink,
        status: 'pending'
      })
      .returning();
    
    return { quoteRequest, uniqueLink };
  }

  async getQuoteByLink(uniqueLink: string): Promise<QuoteRequest | undefined> {
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.uniqueLink, uniqueLink));
    
    return quote;
  }

  async updateQuoteRequest(uniqueLink: string, data: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined> {
    const [quote] = await db
      .update(quoteRequests)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.uniqueLink, uniqueLink))
      .returning();
    
    return quote;
  }

  async getQuotesByUser(userId: string): Promise<QuoteRequest[]> {
    return await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.userId, userId))
      .orderBy(desc(quoteRequests.createdAt));
  }

  async updateUserStripeInfo(userId: string, stripeAccountId: string, onboardingComplete: boolean): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        stripeAccountId,
        stripeOnboardingComplete: onboardingComplete,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // WhatsApp Business operations
  async updateWhatsAppConfig(userId: string, config: any): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        whatsappBusinessToken: config.businessToken,
        whatsappPhoneNumberId: config.phoneNumberId,
        whatsappBusinessAccountId: config.businessAccountId,
        whatsappWebhookVerifyToken: config.webhookVerifyToken,
        whatsappIntegrationActive: config.integrationActive,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async getWhatsAppConversations(userId: string): Promise<WhatsappConversation[]> {
    return await db
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.userId, userId))
      .orderBy(desc(whatsappConversations.lastMessageAt));
  }

  async createWhatsAppConversation(data: InsertWhatsappConversation): Promise<WhatsappConversation> {
    const [conversation] = await db
      .insert(whatsappConversations)
      .values(data)
      .returning();
    
    return conversation;
  }

  async updateConversationState(conversationId: number, state: string, metadata?: any): Promise<WhatsappConversation | undefined> {
    const [conversation] = await db
      .update(whatsappConversations)
      .set({
        conversationState: state,
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(whatsappConversations.id, conversationId))
      .returning();
    
    return conversation;
  }

  async getConversationByPhone(userId: string, clientPhone: string): Promise<WhatsappConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(whatsappConversations)
      .where(and(
        eq(whatsappConversations.userId, userId),
        eq(whatsappConversations.clientPhone, clientPhone)
      ));
    
    return conversation;
  }

  async logWhatsAppMessage(data: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [message] = await db
      .insert(whatsappMessages)
      .values(data)
      .returning();
    
    return message;
  }

  private calculateEnergyRating(): string {
    // Mock energy rating calculation based on Spanish CEE standards
    const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }

  // Financial Management operations
  async getFinancialSummary(userId: string, dateRange?: string): Promise<any> {
    return {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      totalExpenses: 0,
      netIncome: 0,
      currentMonthRevenue: 0,
      previousMonthRevenue: 0,
      revenueGrowth: 0
    };
  }

  async getInvoices(userId: string, dateRange?: string, paymentStatus?: string): Promise<any[]> {
    let query = db.select().from(invoices).where(eq(invoices.userId, userId));
    
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.where(eq(invoices.paymentStatus, paymentStatus));
    }
    
    return await query.orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number, userId: string): Promise<any | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return invoice;
  }

  async createInvoice(data: any): Promise<any> {
    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(data.userId, data.series || "CERT", data.isProforma);
    
    // Determine if accounting registration is required
    const requiresManualAccounting = data.paymentMethod === 'cash';
    const isAccountingRegistered = !requiresManualAccounting; // Auto-register unless cash payment
    
    const invoiceData = {
      ...data,
      invoiceNumber,
      isAccountingRegistered,
      accountingRegisteredAt: isAccountingRegistered ? new Date() : null,
      accountingRegisteredBy: isAccountingRegistered ? data.userId : null,
      manualAccountingRequired: requiresManualAccounting,
      dueDate: data.dueDate || new Date(Date.now() + (data.paymentTerms || 30) * 24 * 60 * 60 * 1000)
    };

    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    return invoice;
  }

  async generateInvoiceNumber(userId: string, series: string = "CERT", isProforma: boolean = false): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = isProforma ? `PRO-${series}` : series;
    
    // Get the last invoice number for this user and series
    const lastInvoices = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.series, series)
      ))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    let nextNumber = 1;
    if (lastInvoices.length > 0) {
      const lastNumber = lastInvoices[0].invoiceNumber.split('-').pop();
      nextNumber = parseInt(lastNumber || '0') + 1;
    }

    return `${prefix}-${currentYear}-${nextNumber.toString().padStart(4, '0')}`;
  }

  async registerInvoiceInAccounting(invoiceId: number, userId: string): Promise<any> {
    const [invoice] = await db
      .update(invoices)
      .set({
        isAccountingRegistered: true,
        accountingRegisteredAt: new Date(),
        accountingRegisteredBy: userId,
        manualAccountingRequired: false
      })
      .where(and(
        eq(invoices.id, invoiceId),
        eq(invoices.userId, userId)
      ))
      .returning();
    
    return invoice;
  }

  async convertProformaToInvoice(proformaId: number, userId: string): Promise<any> {
    // Get the proforma invoice
    const [proforma] = await db
      .select()
      .from(invoices)
      .where(and(
        eq(invoices.id, proformaId),
        eq(invoices.userId, userId),
        eq(invoices.isProforma, true)
      ));

    if (!proforma) {
      throw new Error('Factura proforma no encontrada');
    }

    // Generate new invoice number for the regular invoice
    const newInvoiceNumber = await this.generateInvoiceNumber(userId, proforma.series, false);
    
    // Create new invoice based on proforma
    const { id, ...proformaWithoutId } = proforma;
    const invoiceData = {
      ...proformaWithoutId,
      invoiceNumber: newInvoiceNumber,
      isProforma: false,
      invoiceType: 'invoice',
      isAccountingRegistered: proforma.paymentMethod !== 'cash',
      accountingRegisteredAt: proforma.paymentMethod !== 'cash' ? new Date() : null,
      accountingRegisteredBy: proforma.paymentMethod !== 'cash' ? userId : null,
      manualAccountingRequired: proforma.paymentMethod === 'cash'
    };
    
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    
    return newInvoice;
  }

  async updateInvoice(id: number, userId: string, data: any): Promise<any | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)));
    return result.rowCount > 0;
  }

  async generateInvoicePdf(id: number, userId: string): Promise<string> {
    return `invoice-${id}.pdf`;
  }

  async sendInvoiceEmail(id: number, userId: string): Promise<boolean> {
    await this.updateInvoice(id, userId, { 
      sentDate: new Date(),
      sentCount: 1
    });
    return true;
  }

  async getPayments(userId: string, dateRange?: string): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByInvoice(invoiceId: number, userId: string): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .where(and(eq(payments.invoiceId, invoiceId), eq(payments.userId, userId)))
      .orderBy(desc(payments.createdAt));
  }

  async recordPayment(data: any): Promise<any> {
    const [payment] = await db
      .insert(payments)
      .values({
        ...data,
        paymentDate: new Date(),
      })
      .returning();
    
    await this.updateInvoice(data.invoiceId, data.userId, {
      paymentStatus: 'paid',
      paidDate: new Date(),
      paidAmount: data.amount
    });
    
    return payment;
  }

  async getCollections(userId: string, dateRange?: string, paymentMethod?: string): Promise<Collection[]> {
    let query = db.select().from(collections).where(eq(collections.userId, userId));
    
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          const days = parseInt(dateRange);
          if (!isNaN(days)) {
            startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          }
      }
      
      query = query.where(and(
        eq(collections.userId, userId),
        gte(collections.collectionDate, startDate)
      ));
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      query = query.where(eq(collections.paymentMethod, paymentMethod));
    }
    
    return await query.orderBy(desc(collections.collectionDate));
  }

  async getCollection(id: number, userId: string): Promise<Collection | undefined> {
    const [collection] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
    return collection;
  }

  async createCollection(data: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values({
        ...data,
        collectionDate: new Date(data.collectionDate),
      })
      .returning();
    return collection;
  }

  async updateCollection(id: number, userId: string, data: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [collection] = await db
      .update(collections)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(collections.id, id), eq(collections.userId, userId)))
      .returning();
    return collection;
  }

  async deleteCollection(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(collections)
      .where(and(eq(collections.id, id), eq(collections.userId, userId)));
    return result.rowCount > 0;
  }

  async getInvoiceCollections(invoiceId: number, userId: string): Promise<Collection[]> {
    return await db
      .select()
      .from(collections)
      .where(and(
        eq(collections.userId, userId),
        eq(collections.invoiceId, invoiceId),
        eq(collections.isInvoicePayment, true)
      ))
      .orderBy(desc(collections.collectionDate));
  }

  async recordInvoicePayment(invoiceId: number, collectionData: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values({
        ...collectionData,
        invoiceId,
        isInvoicePayment: true,
        collectionDate: new Date(collectionData.collectionDate),
      })
      .returning();
    return collection;
  }

  // WhatsApp Flow Templates operations
  async getWhatsappFlowTemplates(userId: string): Promise<WhatsappFlowTemplate[]> {
    return await db
      .select()
      .from(whatsappFlowTemplates)
      .where(eq(whatsappFlowTemplates.userId, userId))
      .orderBy(desc(whatsappFlowTemplates.createdAt));
  }

  async getWhatsappFlowTemplate(id: number, userId: string): Promise<WhatsappFlowTemplate | undefined> {
    const [template] = await db
      .select()
      .from(whatsappFlowTemplates)
      .where(and(eq(whatsappFlowTemplates.id, id), eq(whatsappFlowTemplates.userId, userId)));
    return template;
  }

  async createWhatsappFlowTemplate(data: InsertWhatsappFlowTemplate): Promise<WhatsappFlowTemplate> {
    const [template] = await db
      .insert(whatsappFlowTemplates)
      .values(data)
      .returning();
    return template;
  }

  async updateWhatsappFlowTemplate(id: number, userId: string, data: Partial<InsertWhatsappFlowTemplate>): Promise<WhatsappFlowTemplate | undefined> {
    const [template] = await db
      .update(whatsappFlowTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(whatsappFlowTemplates.id, id), eq(whatsappFlowTemplates.userId, userId)))
      .returning();
    return template;
  }

  async deleteWhatsappFlowTemplate(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(whatsappFlowTemplates)
      .where(and(eq(whatsappFlowTemplates.id, id), eq(whatsappFlowTemplates.userId, userId)));
    return result.rowCount > 0;
  }

  async getActiveWhatsappFlowTemplate(userId: string): Promise<WhatsappFlowTemplate | undefined> {
    const [template] = await db
      .select()
      .from(whatsappFlowTemplates)
      .where(and(eq(whatsappFlowTemplates.userId, userId), eq(whatsappFlowTemplates.isActive, true)))
      .orderBy(desc(whatsappFlowTemplates.updatedAt));
    return template;
  }

  // Manager Financial Records Implementation
  async getManagerFinancialRecords(userId: string, filters: {
    searchType?: string;
    paymentMethodFilter?: string;
    invoiceStatusFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    try {
      // Base query for invoices with LEFT JOIN to get payment data
      let invoiceQuery = db
        .select({
          id: invoices.id,
          type: sql<string>`'invoice'`,
          clientName: invoices.clientName,
          clientEmail: invoices.clientEmail,
          amount: invoices.total,
          paymentMethod: invoices.paymentMethod,
          paymentDate: invoices.paidDate,
          invoiceDate: invoices.issueDate,
          concept: invoices.description,
          invoiceId: invoices.id,
          collectionDate: sql<string>`NULL`
        })
        .from(invoices)
        .where(eq(invoices.userId, userId));

      // Base query for collections
      let collectionQuery = db
        .select({
          id: collections.id,
          type: sql<string>`'collection'`,
          clientName: collections.clientName,
          clientEmail: collections.clientEmail,
          amount: collections.amount,
          paymentMethod: collections.paymentMethod,
          paymentDate: collections.collectionDate,
          invoiceDate: sql<string>`NULL`,
          concept: collections.concept,
          invoiceId: collections.invoiceId,
          collectionDate: collections.collectionDate
        })
        .from(collections)
        .where(eq(collections.userId, userId));

      // Build combined WHERE conditions for each query
      const invoiceConditions = [eq(invoices.userId, userId)];
      const collectionConditions = [eq(collections.userId, userId)];

      // Apply date filters
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (filters.searchType === 'payment_date') {
          invoiceConditions.push(gte(invoices.paidDate, fromDate));
          collectionConditions.push(gte(collections.collectionDate, fromDate));
        } else if (filters.searchType === 'invoice_date') {
          invoiceConditions.push(gte(invoices.issueDate, fromDate));
        }
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        if (filters.searchType === 'payment_date') {
          invoiceConditions.push(lte(invoices.paidDate, toDate));
          collectionConditions.push(lte(collections.collectionDate, toDate));
        } else if (filters.searchType === 'invoice_date') {
          invoiceConditions.push(lte(invoices.issueDate, toDate));
        }
      }

      // Apply payment method filter
      if (filters.paymentMethodFilter && filters.paymentMethodFilter !== 'all') {
        invoiceConditions.push(eq(invoices.paymentMethod, filters.paymentMethodFilter));
        collectionConditions.push(eq(collections.paymentMethod, filters.paymentMethodFilter));
      }

      // Apply invoice status filter
      if (filters.invoiceStatusFilter === 'invoiced') {
        // Only get invoices or collections that have invoice IDs
        collectionConditions.push(sql`${collections.invoiceId} IS NOT NULL`);
      } else if (filters.invoiceStatusFilter === 'not_invoiced') {
        // Only get collections without invoice IDs
        collectionConditions.push(isNull(collections.invoiceId));
        // Don't get any invoices for this filter
        invoiceConditions.push(sql`1 = 0`);
      }

      // Apply the conditions to the queries
      if (invoiceConditions.length > 1) {
        invoiceQuery = invoiceQuery.where(and(...invoiceConditions));
      }
      if (collectionConditions.length > 1) {
        collectionQuery = collectionQuery.where(and(...collectionConditions));
      }

      // Execute both queries
      const [invoiceResults, collectionResults] = await Promise.all([
        invoiceQuery,
        collectionQuery
      ]);

      // Combine and sort results
      const allResults = [
        ...invoiceResults.filter(record => record.type !== 'none'),
        ...collectionResults
      ];

      // Sort by payment date or collection date descending
      allResults.sort((a, b) => {
        const dateA = new Date(a.paymentDate || a.collectionDate || 0);
        const dateB = new Date(b.paymentDate || b.collectionDate || 0);
        return dateB.getTime() - dateA.getTime();
      });

      return allResults;
    } catch (error) {
      console.error("Error getting manager financial records:", error);
      return [];
    }
  }

  async createInvoiceFromCollection(collectionId: number, userId: string): Promise<Invoice | undefined> {
    try {
      // Get the collection data
      const [collection] = await db
        .select()
        .from(collections)
        .where(and(
          eq(collections.id, collectionId), 
          eq(collections.userId, userId),
          eq(collections.paymentMethod, 'cash'),
          isNull(collections.invoiceId)
        ));

      if (!collection) {
        return undefined;
      }

      // Create invoice from collection data
      const invoiceData = {
        userId,
        invoiceNumber: `INV-${Date.now()}`,
        series: 'A',
        clientName: collection.clientName || 'Cliente',
        clientEmail: collection.clientEmail || '',
        clientPhone: collection.clientPhone,
        subtotal: collection.amount,
        vatRate: collection.vatRate,
        vatAmount: collection.vatAmount,
        total: collection.amount,
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        issueDate: new Date(),
        dueDate: new Date(),
        paidDate: new Date(collection.collectionDate),
        description: collection.concept || 'Certificación energética',
        isAccountingRegistered: false,
        manualAccountingRequired: true
      };

      const [invoice] = await db
        .insert(invoices)
        .values(invoiceData)
        .returning();

      // Update collection to link it to the invoice
      await db
        .update(collections)
        .set({ 
          invoiceId: invoice.id,
          isInvoicePayment: true,
          updatedAt: new Date()
        })
        .where(eq(collections.id, collectionId));

      return invoice;
    } catch (error) {
      console.error("Error creating invoice from collection:", error);
      return undefined;
    }
  }

  async deleteCollection(id: number, userId: string): Promise<boolean> {
    try {
      // Only allow deletion of cash collections without invoices
      const result = await db
        .delete(collections)
        .where(and(
          eq(collections.id, id),
          eq(collections.userId, userId),
          eq(collections.paymentMethod, 'cash'),
          isNull(collections.invoiceId)
        ));
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting collection:", error);
      return false;
    }
  }

  // Uploaded certificates implementation
  async getUploadedCertificates(userId: string, folderId?: number): Promise<UploadedCertificate[]> {
    let query = db.select().from(uploadedCertificates).where(eq(uploadedCertificates.userId, userId));
    
    if (folderId !== undefined) {
      query = query.where(and(eq(uploadedCertificates.userId, userId), eq(uploadedCertificates.folderId, folderId)));
    }
    
    return await query.orderBy(desc(uploadedCertificates.createdAt));
  }

  async getUploadedCertificate(id: number, userId: string): Promise<UploadedCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(uploadedCertificates)
      .where(and(eq(uploadedCertificates.id, id), eq(uploadedCertificates.userId, userId)));
    return certificate;
  }

  async createUploadedCertificate(data: InsertUploadedCertificate): Promise<UploadedCertificate> {
    const [certificate] = await db
      .insert(uploadedCertificates)
      .values(data)
      .returning();
    return certificate;
  }

  async updateUploadedCertificate(id: number, userId: string, data: Partial<InsertUploadedCertificate>): Promise<UploadedCertificate | undefined> {
    const [certificate] = await db
      .update(uploadedCertificates)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(uploadedCertificates.id, id), eq(uploadedCertificates.userId, userId)))
      .returning();
    return certificate;
  }

  async deleteUploadedCertificate(id: number, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(uploadedCertificates)
        .where(and(eq(uploadedCertificates.id, id), eq(uploadedCertificates.userId, userId)));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting uploaded certificate:", error);
      return false;
    }
  }

  async sendCertificateViaEmail(certificateId: number, userId: string, recipientEmail: string): Promise<boolean> {
    try {
      const certificate = await this.getUploadedCertificate(certificateId, userId);
      if (!certificate) return false;

      // Update sent status
      await this.updateUploadedCertificate(certificateId, userId, {
        sentViaEmail: true,
        emailSentAt: new Date()
      });

      // Here you would integrate with SendGrid or your email service
      // For now, we'll just mark it as sent
      return true;
    } catch (error) {
      console.error("Error sending certificate via email:", error);
      return false;
    }
  }

  // Client folder document management methods
  
  async getFolderDocuments(folderId: number, userId: string): Promise<any[]> {
    try {
      const result = await db.$client.query(`
        SELECT * FROM folder_documents 
        WHERE folder_id = $1 AND user_id = $2 
        ORDER BY uploaded_at DESC
      `, [folderId, userId]);
      
      return result.rows;
    } catch (error) {
      console.error("Error fetching folder documents:", error);
      return [];
    }
  }

  async getCertificationByFolderId(folderId: number, userId: string): Promise<any | undefined> {
    const [certification] = await db
      .select()
      .from(certifications)
      .where(and(
        eq(certifications.folderId, folderId),
        eq(certifications.userId, userId)
      ));
    return certification;
  }

  async createFolderDocument(data: any): Promise<any> {
    try {
      const result = await db.$client.query(`
        INSERT INTO folder_documents (user_id, folder_id, file_name, original_name, file_path, file_size, file_type, category, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [data.userId, data.folderId, data.fileName, data.originalName, data.filePath, data.fileSize, data.fileType, data.category, data.description]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error creating folder document:", error);
      throw error;
    }
  }

  async getFolderDocument(documentId: number, folderId: number, userId: string): Promise<any | undefined> {
    try {
      const result = await db.$client.query(`
        SELECT * FROM folder_documents 
        WHERE id = $1 AND folder_id = $2 AND user_id = $3
      `, [documentId, folderId, userId]);
      
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching folder document:", error);
      return undefined;
    }
  }

  async deleteFolderDocument(documentId: number, folderId: number, userId: string): Promise<boolean> {
    try {
      const result = await db.$client.query(`
        DELETE FROM folder_documents 
        WHERE id = $1 AND folder_id = $2 AND user_id = $3
      `, [documentId, folderId, userId]);
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting folder document:", error);
      return false;
    }
  }

  async sendCertificateViaWhatsApp(certificateId: number, userId: string, recipientPhone: string): Promise<boolean> {
    try {
      const certificate = await this.getUploadedCertificate(certificateId, userId);
      if (!certificate) return false;

      // Update sent status
      await this.updateUploadedCertificate(certificateId, userId, {
        sentViaWhatsapp: true,
        whatsappSentAt: new Date()
      });

      // Here you would integrate with WhatsApp Business API
      // For now, we'll just mark it as sent
      return true;
    } catch (error) {
      console.error("Error sending certificate via WhatsApp:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();