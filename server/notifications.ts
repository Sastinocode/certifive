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
      // Get user email from the database
      const [user] = await db
        .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, notification.userId));

      if (!user?.email) {
        console.warn(`User email not found for userId: ${notification.userId}, skipping email notification`);
        return;
      }

      console.log(`Preparing to send email notification to: ${user.email}`);

      const emailContent = this.getEmailContent(notification, user);

      await mailService.send({
        to: user.email,
        from: process.env.FROM_EMAIL || 'notifications@certifive.com',
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
  private getEmailContent(notification: Notification, user?: { email: string; firstName: string | null; lastName: string | null }): { subject: string; html: string; text: string } {
    const baseSubject = 'CERTIFIVE - ';
    const data = notification.data as NotificationData || {};
    const userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.email?.split('@')[0] || 'Certificador';

    switch (notification.type) {
      case 'new_certification':
        return {
          subject: `${baseSubject}Nueva Solicitud de Certificación`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #22d3ee; margin: 0; font-size: 24px;">CERTIFIVE</h1>
                <p style="color: #6b7280; margin: 5px 0;">Gestión Inteligente de Certificaciones Energéticas</p>
              </div>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
                <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">Nueva Solicitud de Certificación</h2>
                <p style="color: #374151; margin: 0 0 15px 0;">Hola ${userName},</p>
                <p style="color: #374151; margin: 0 0 15px 0;">Se ha recibido una nueva solicitud de certificación energética que requiere tu atención.</p>
              </div>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Detalles de la Solicitud:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Cliente:</td>
                    <td style="padding: 8px 0; color: #374151;">${data.clientName || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Referencia Catastral:</td>
                    <td style="padding: 8px 0; color: #374151;">${data.cadastralRef || 'No especificada'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Fecha:</td>
                    <td style="padding: 8px 0; color: #374151;">${new Date().toLocaleDateString('es-ES')}</td>
                  </tr>
                </table>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Este correo se envió automáticamente desde tu sistema CERTIFIVE.<br>
                  Accede a tu dashboard para gestionar esta solicitud.
                </p>
              </div>
            </div>
          `,
          text: `CERTIFIVE - Nueva Solicitud de Certificación
            
            Hola ${userName},
            
            Se ha recibido una nueva solicitud de certificación energética.
            
            DETALLES:
            • Cliente: ${data.clientName || 'No especificado'}
            • Referencia Catastral: ${data.cadastralRef || 'No especificada'}
            • Fecha: ${new Date().toLocaleDateString('es-ES')}
            
            Accede a tu dashboard para gestionar esta solicitud.`
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