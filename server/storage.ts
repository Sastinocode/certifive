import { 
  users, 
  certifications,
  pricingRates,
  quoteRequests,
  type User, 
  type UpsertUser,
  type Certification,
  type InsertCertification,
  type UpdateCertification,
  type PricingRate,
  type InsertPricingRate,
  type QuoteRequest,
  type InsertQuoteRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Certification operations
  getDashboardStats(userId: string): Promise<any>;
  getRecentCertifications(userId: string): Promise<any[]>;
  getCertificationsByUser(userId: string): Promise<Certification[]>;
  getCertification(id: number, userId: string): Promise<Certification | undefined>;
  createCertification(data: InsertCertification): Promise<Certification>;
  updateCertification(id: number, userId: string, data: UpdateCertification): Promise<Certification | undefined>;
  addPhotos(id: number, userId: string, photos: string[]): Promise<Certification | undefined>;
  completeCertification(id: number, userId: string): Promise<Certification | undefined>;
  
  // Pricing and quotes operations
  getPricingRates(userId: string): Promise<PricingRate[]>;
  createPricingRate(data: InsertPricingRate): Promise<PricingRate>;
  updatePricingRate(id: number, userId: string, data: Partial<InsertPricingRate>): Promise<PricingRate | undefined>;
  deletePricingRate(id: number, userId: string): Promise<boolean>;
  createQuoteRequest(userId: string): Promise<{ quoteRequest: QuoteRequest; uniqueLink: string }>;
  getQuoteByLink(uniqueLink: string): Promise<QuoteRequest | undefined>;
  updateQuoteRequest(uniqueLink: string, data: Partial<InsertQuoteRequest>): Promise<QuoteRequest | undefined>;
  getQuotesByUser(userId: string): Promise<QuoteRequest[]>;
  updateUserStripeInfo(userId: string, stripeAccountId: string, onboardingComplete: boolean): Promise<User | undefined>;
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

    return {
      activeCertificates: completedCerts?.count || 0,
      inProgress: inProgressCerts?.count || 0,
      expiringSoon: 0,
      co2Savings: 0
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

  async getCertificationsByUser(userId: string): Promise<Certification[]> {
    return await db
      .select()
      .from(certifications)
      .where(eq(certifications.userId, userId))
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

  // Pricing rates operations
  async getPricingRates(userId: string): Promise<PricingRate[]> {
    return await db
      .select()
      .from(pricingRates)
      .where(eq(pricingRates.userId, userId))
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
    
    return result.rowCount > 0;
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

  private calculateEnergyRating(): string {
    // Mock energy rating calculation based on Spanish CEE standards
    const ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    return ratings[Math.floor(Math.random() * ratings.length)];
  }
}

export const storage = new DatabaseStorage();