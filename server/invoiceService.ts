// @ts-nocheck
import { db } from "./db";
import { storage } from "./storage";
import { invoices, users, certifications } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface InvoiceData {
  certificationId?: number;
  quoteRequestId?: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientNif?: string;
  clientCity?: string;
  clientPostalCode?: string;
  subtotal: number;
  vatRate?: number;
  irpfRate?: number;
  description: string;
  lineItems?: any[];
  notes?: string;
  paymentMethod?: string;
  paymentTerms?: number;
}

export interface ProfessionalInvoiceData extends InvoiceData {
  // Professional data (automatically populated)
  professionalName: string;
  professionalDni: string;
  professionalEmail: string;
  professionalPhone?: string;
  professionalAddress?: string;
  professionalCompany?: string;
  professionalLicense?: string;
}

export class InvoiceService {
  
  /**
   * Creates a professional invoice with automatic population of professional data
   */
  async createProfessionalInvoice(userId: string, invoiceData: InvoiceData): Promise<any> {
    // Get user profile data
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Validate required professional data
    if (!user.dni) {
      throw new Error("DNI/NIF es requerido en el perfil profesional para generar facturas legales");
    }

    if (!user.firstName || !user.lastName) {
      throw new Error("Nombre y apellidos son requeridos en el perfil profesional");
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(userId);

    // Calculate financial details
    const vatRate = invoiceData.vatRate || 21.00;
    const irpfRate = invoiceData.irpfRate || 0.00;
    const vatAmount = (invoiceData.subtotal * vatRate) / 100;
    const irpfAmount = (invoiceData.subtotal * irpfRate) / 100;
    const total = invoiceData.subtotal + vatAmount - irpfAmount;

    // Calculate due date
    const paymentTerms = invoiceData.paymentTerms || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);

    // Create professional invoice data
    const professionalInvoiceData: any = {
      userId,
      certificationId: invoiceData.certificationId,
      quoteRequestId: invoiceData.quoteRequestId,
      
      // Invoice identification
      invoiceNumber,
      series: "CERT",
      invoiceType: "invoice",
      isProforma: false,
      
      // Professional data (automatically populated from user profile)
      professionalName: `${user.firstName} ${user.lastName}`.trim(),
      professionalDni: user.dni,
      professionalEmail: user.email,
      professionalPhone: user.phone,
      professionalAddress: user.address,
      professionalCompany: user.company,
      professionalLicense: user.license,
      
      // Client information
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientPhone: invoiceData.clientPhone,
      clientAddress: invoiceData.clientAddress,
      clientNif: invoiceData.clientNif,
      clientCity: invoiceData.clientCity,
      clientPostalCode: invoiceData.clientPostalCode,
      
      // Financial details
      subtotal: invoiceData.subtotal.toString(),
      vatRate: vatRate.toString(),
      vatAmount: vatAmount.toString(),
      irpfRate: irpfRate.toString(),
      irpfAmount: irpfAmount.toString(),
      total: total.toString(),
      
      // Payment details
      paymentStatus: "pending",
      paymentMethod: invoiceData.paymentMethod,
      paymentTerms,
      dueDate,
      paidAmount: "0.00",
      
      // Invoice content
      description: invoiceData.description,
      lineItems: invoiceData.lineItems || [],
      notes: invoiceData.notes,
      
      // Timestamps
      issuedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert invoice into database
    const [newInvoice] = await db
      .insert(invoices)
      .values(professionalInvoiceData)
      .returning();

    return newInvoice;
  }

  /**
   * Creates an invoice automatically from a certification
   */
  async createInvoiceFromCertification(userId: string, certificationId: number, paymentMethod?: string): Promise<any> {
    const certification = await storage.getCertification(certificationId, userId);
    if (!certification) {
      throw new Error("Certificación no encontrada");
    }

    // Calculate price based on property type and area
    const basePrice = this.calculateCertificationPrice(certification);

    const invoiceData: InvoiceData = {
      certificationId,
      clientName: certification.ownerName,
      clientEmail: certification.email,
      clientPhone: certification.phone,
      clientNif: certification.ownerDni,
      subtotal: basePrice,
      description: `Certificado de Eficiencia Energética - ${certification.propertyAddress}`,
      lineItems: [
        {
          description: `Certificado de Eficiencia Energética`,
          propertyAddress: certification.propertyAddress,
          cadastralRef: certification.cadastralRef,
          quantity: 1,
          unitPrice: basePrice,
          total: basePrice
        }
      ],
      paymentMethod: paymentMethod || "transfer",
      notes: `Certificación energética para la propiedad ubicada en ${certification.propertyAddress}. Referencia catastral: ${certification.cadastralRef}`
    };

    return await this.createProfessionalInvoice(userId, invoiceData);
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CERT-${year}`;
    
    // Get last invoice number for this user and year
    const lastInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.id))
      .limit(1);

    let nextNumber = 1;
    if (lastInvoices.length > 0) {
      const lastInvoiceNumber = lastInvoices[0].invoiceNumber;
      const match = lastInvoiceNumber.match(/CERT-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate certification price based on property characteristics
   */
  private calculateCertificationPrice(certification: any): number {
    // Base prices by property type (in euros)
    const basePrices = {
      'vivienda': 150,
      'local': 200,
      'oficina': 180,
      'industrial': 300,
      'otros': 150
    };

    const propertyType = certification.propertyType?.toLowerCase() || 'vivienda';
    let basePrice = basePrices[propertyType as keyof typeof basePrices] || basePrices.otros;

    // Adjust price based on total area
    const totalArea = certification.totalArea || 0;
    if (totalArea > 200) {
      basePrice += 50; // Large property surcharge
    } else if (totalArea > 100) {
      basePrice += 25; // Medium property surcharge
    }

    return basePrice;
  }

  /**
   * Get all invoices for a user
   */
  async getUserInvoices(userId: string, limit = 50): Promise<any[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: number, userId: string): Promise<any | null> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId));

    if (!invoice || invoice.userId !== userId) {
      return null;
    }

    return invoice;
  }

  /**
   * Update invoice payment status
   */
  async updatePaymentStatus(invoiceId: number, userId: string, status: string, paidAmount?: number, paymentMethod?: string): Promise<any> {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: new Date()
    };

    if (status === 'paid' && paidAmount) {
      updateData.paidAmount = paidAmount.toString();
      updateData.paidDate = new Date();
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoiceId))
      .returning();

    return updatedInvoice;
  }

  /**
   * Validate professional profile completeness for invoicing
   */
  async validateProfessionalProfile(userId: string): Promise<{ isValid: boolean; missingFields: string[] }> {
    const user = await storage.getUser(userId);
    if (!user) {
      return { isValid: false, missingFields: ['Usuario no encontrado'] };
    }

    const missingFields: string[] = [];

    if (!user.dni) missingFields.push('DNI/NIF');
    if (!user.firstName) missingFields.push('Nombre');
    if (!user.lastName) missingFields.push('Apellidos');
    if (!user.email) missingFields.push('Email');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}

export const invoiceService = new InvoiceService();