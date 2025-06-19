import { db } from "./db";
import { notifications, users, type InsertNotification, type Notification } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { MailService } from '@sendgrid/mail';

// Initialize SendGrid if API key is available
let mailService: MailService | null = null;
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

export interface NotificationData {
  certificationId?: number;
  paymentId?: number;
  quoteId?: number;
  amount?: number;
  clientName?: string;
  cadastralRef?: string;
  expirationDate?: string;
  [key: string]: any;
}

export class NotificationService {
  // Create a new notification
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: NotificationData
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        data: data || null,
        read: false,
        emailSent: false,
      })
      .returning();

    // Send email notification
    await this.sendEmailNotification(notification);

    return notification;
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt));
  }

  // Get all notifications for a user
  async getAllNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        read: true, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        read: true, 
        updatedAt: new Date() 
      })
      .where(eq(notifications.userId, userId));
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    
    return result.length;
  }

  // Send email notification
  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!mailService) {
      console.warn('SendGrid not configured, skipping email notification');
      return;
    }

    try {
      // Get user email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, notification.userId));

      if (!user?.email) {
        console.warn('User email not found, skipping email notification');
        return;
      }

      const emailContent = this.getEmailContent(notification);

      await mailService.send({
        to: user.email,
        from: process.env.FROM_EMAIL || 'notifications@certificadosenergia.com',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      // Mark email as sent
      await db
        .update(notifications)
        .set({ emailSent: true })
        .where(eq(notifications.id, notification.id));

      console.log(`Email notification sent to ${user.email} for notification ${notification.id}`);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  // Generate email content based on notification type
  private getEmailContent(notification: Notification): { subject: string; html: string; text: string } {
    const baseSubject = 'CertificadoEnergia - ';
    const data = notification.data as NotificationData || {};

    switch (notification.type) {
      case 'new_certification':
        return {
          subject: `${baseSubject}Nueva Solicitud de Certificación`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Nueva Solicitud de Certificación</h2>
              <p>Se ha recibido una nueva solicitud de certificación energética.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Cliente:</strong> ${data.clientName || 'No especificado'}</p>
                <p><strong>Referencia Catastral:</strong> ${data.cadastralRef || 'No especificada'}</p>
              </div>
              <p>Puedes revisar los detalles completos en tu panel de control.</p>
              <p style="color: #666; font-size: 12px;">Esta es una notificación automática del sistema CertificadoEnergia.</p>
            </div>
          `,
          text: `Nueva solicitud de certificación energética recibida. Cliente: ${data.clientName || 'No especificado'}. Referencia: ${data.cadastralRef || 'No especificada'}.`
        };

      case 'payment_received':
        return {
          subject: `${baseSubject}Pago Recibido`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Pago Recibido</h2>
              <p>Se ha procesado un pago exitosamente.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Cliente:</strong> ${data.clientName || 'No especificado'}</p>
                <p><strong>Importe:</strong> €${data.amount || '0'}</p>
                <p><strong>Referencia:</strong> ${data.cadastralRef || 'No especificada'}</p>
              </div>
              <p>El pago ha sido confirmado y registrado en el sistema.</p>
              <p style="color: #666; font-size: 12px;">Esta es una notificación automática del sistema CertificadoEnergia.</p>
            </div>
          `,
          text: `Pago recibido. Cliente: ${data.clientName || 'No especificado'}. Importe: €${data.amount || '0'}.`
        };

      case 'certificate_expiring':
        return {
          subject: `${baseSubject}Certificado Próximo a Vencer`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">Certificado Próximo a Vencer</h2>
              <p>Un certificado energético está próximo a su fecha de vencimiento.</p>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Cliente:</strong> ${data.clientName || 'No especificado'}</p>
                <p><strong>Referencia Catastral:</strong> ${data.cadastralRef || 'No especificada'}</p>
                <p><strong>Fecha de Vencimiento:</strong> ${data.expirationDate || 'No especificada'}</p>
              </div>
              <p>Te recomendamos contactar al cliente para programar la renovación.</p>
              <p style="color: #666; font-size: 12px;">Esta es una notificación automática del sistema CertificadoEnergia.</p>
            </div>
          `,
          text: `Certificado próximo a vencer. Cliente: ${data.clientName || 'No especificado'}. Vencimiento: ${data.expirationDate || 'No especificada'}.`
        };

      case 'quote_request':
        return {
          subject: `${baseSubject}Nueva Solicitud de Presupuesto`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Nueva Solicitud de Presupuesto</h2>
              <p>Se ha recibido una nueva solicitud de presupuesto a través del formulario público.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Cliente:</strong> ${data.clientName || 'No especificado'}</p>
                <p><strong>Referencia Catastral:</strong> ${data.cadastralRef || 'No especificada'}</p>
              </div>
              <p>Puedes revisar y responder la solicitud en tu panel de control.</p>
              <p style="color: #666; font-size: 12px;">Esta es una notificación automática del sistema CertificadoEnergia.</p>
            </div>
          `,
          text: `Nueva solicitud de presupuesto recibida. Cliente: ${data.clientName || 'No especificado'}.`
        };

      default:
        return {
          subject: `${baseSubject}${notification.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">${notification.title}</h2>
              <p>${notification.message}</p>
              <p style="color: #666; font-size: 12px;">Esta es una notificación automática del sistema CertificadoEnergia.</p>
            </div>
          `,
          text: `${notification.title}: ${notification.message}`
        };
    }
  }

  // Helper methods for common notification types
  async notifyNewCertification(userId: string, clientName: string, cadastralRef: string, certificationId: number): Promise<void> {
    await this.createNotification(
      userId,
      'new_certification',
      'Nueva Solicitud de Certificación',
      `Se ha recibido una nueva solicitud de certificación de ${clientName}`,
      { clientName, cadastralRef, certificationId }
    );
  }

  async notifyPaymentReceived(userId: string, clientName: string, amount: number, paymentId: number): Promise<void> {
    await this.createNotification(
      userId,
      'payment_received',
      'Pago Recibido',
      `Se ha recibido un pago de €${amount} de ${clientName}`,
      { clientName, amount, paymentId }
    );
  }

  async notifyCertificateExpiring(userId: string, clientName: string, cadastralRef: string, expirationDate: string): Promise<void> {
    await this.createNotification(
      userId,
      'certificate_expiring',
      'Certificado Próximo a Vencer',
      `El certificado de ${clientName} vence el ${expirationDate}`,
      { clientName, cadastralRef, expirationDate }
    );
  }

  async notifyQuoteRequest(userId: string, clientName: string, cadastralRef: string, quoteId: number): Promise<void> {
    await this.createNotification(
      userId,
      'quote_request',
      'Nueva Solicitud de Presupuesto',
      `${clientName} ha solicitado un presupuesto`,
      { clientName, cadastralRef, quoteId }
    );
  }
}

export const notificationService = new NotificationService();