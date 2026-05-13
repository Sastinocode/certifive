import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { certifications, payments, invoices } from "../../shared/schema";
import { authenticate } from "../auth";
import { createNotification } from "../createNotification";
import { sendPagoConfirmadoEmail, sendPagoManualPendienteEmail } from "../email";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export function registerPaymentRoutes(app: Express) {
app.get("/api/pay/:token", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.paymentToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Enlace de pago inválido" });

    const tramo = cert.tramo1PaidAt ? 2 : 1;
    const amount = tramo === 1
      ? (cert.tramo1Amount ? parseFloat(cert.tramo1Amount as any) : 0)
      : (cert.tramo2Amount ? parseFloat(cert.tramo2Amount as any) : 0);

    const [certifier] = await db.select({
      name: users.name,
      company: users.company,
      phone: users.phone,
      email: users.email,
      bizumPhone: users.bizumPhone,
      iban: users.iban,
      enabledPaymentMethods: users.enabledPaymentMethods,
    }).from(users).where(eq(users.id, cert.userId!)).limit(1);

    res.json({
      tramo,
      amount,
      totalAmount: cert.finalPrice ? parseFloat(cert.finalPrice as any) : 0,
      cert: {
        ownerName: cert.ownerName,
        address: cert.address,
        city: cert.city,
        propertyType: cert.propertyType,
      },
      certifier: {
        name: certifier?.name ?? "Tu certificador",
        company: certifier?.company ?? null,
        phone: certifier?.phone ?? null,
        email: certifier?.email ?? null,
        bizumPhone: certifier?.bizumPhone ?? null,
        iban: certifier?.iban ?? null,
        enabledPaymentMethods: (certifier?.enabledPaymentMethods as string[]) ?? ["stripe", "bizum", "transferencia", "efectivo"],
      },
      alreadyPaid: tramo === 2 && !!cert.tramo2PaidAt,
    });
  } catch {
    res.status(500).json({ message: "Error al cargar datos de pago" });
  }
});

// Public: create Stripe PaymentIntent
app.post("/api/pay/:token/stripe-intent", async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });

    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.paymentToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Enlace inválido" });

    const tramo = cert.tramo1PaidAt ? 2 : 1;
    const amount = tramo === 1
      ? parseFloat((cert.tramo1Amount ?? "0") as any)
      : parseFloat((cert.tramo2Amount ?? "0") as any);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: { certificationId: String(cert.id), tramo: String(tramo) },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch {
    res.status(500).json({ message: "Error al crear intención de pago" });
  }
});

// Public: notify manual payment (bizum / transfer / cash)
app.post("/api/pay/:token/manual", async (req: Request, res: Response) => {
  try {
    const { metodo, notas } = req.body;
    if (!metodo) return res.status(400).json({ message: "Método de pago requerido" });

    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.paymentToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Enlace inválido" });

    const tramo = cert.tramo1PaidAt ? 2 : 1;
    const amount = tramo === 1
      ? parseFloat((cert.tramo1Amount ?? "0") as any)
      : parseFloat((cert.tramo2Amount ?? "0") as any);

    await db.insert(payments).values({
      userId: cert.userId!,
      certificationId: cert.id,
      amount: String(amount),
      currency: "eur",
      status: "pending",
      tramo,
      metodo,
      estadoConfirmacion: "pendiente_confirmacion",
      fechaNotificacion: new Date(),
      notas: notas || null,
      description: `Tramo ${tramo} - ${metodo} - ${cert.ownerName ?? ""}`,
    });

    await db.update(certifications)
      .set({ workflowStatus: `pago_${tramo}_pendiente`, updatedAt: new Date() })
      .where(eq(certifications.id, cert.id));

    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    if (certifier?.email) {
      sendPagoManualPendienteEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName: cert.ownerName ?? "Propietario",
        metodo,
        amount,
        tramo: tramo as 1 | 2,
      });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al notificar pago" });
  }
});

// Stripe webhook
app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
  if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;
  try {
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
    event = webhookSecret
      ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
      : req.body;
  } catch {
    return res.status(400).json({ message: "Webhook signature invalid" });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const certId = parseInt(intent.metadata?.certificationId ?? "0");
    const tramo = parseInt(intent.metadata?.tramo ?? "1") as 1 | 2;

    if (certId) {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId)).limit(1);
      if (cert) {
        const amount = tramo === 1
          ? parseFloat((cert.tramo1Amount ?? "0") as any)
          : parseFloat((cert.tramo2Amount ?? "0") as any);

        await db.update(certifications)
          .set({
            [`tramo${tramo}PaidAt`]: new Date(),
            workflowStatus: `pago_${tramo}_confirmado`,
            updatedAt: new Date(),
          })
          .where(eq(certifications.id, certId));

        // If tramo 1, auto-generate CEE form link
        const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);

        if (tramo === 1 && certifier) {
          const ceeToken = cert.ceeToken ?? nanoid(32);
          await db.update(certifications)
            .set({ ceeToken, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
            .where(eq(certifications.id, certId));

          const host = "certifive.es";
          const ceeUrl = `https://${host}/formulario-cee/${ceeToken}`;
          if (cert.ownerEmail) {
            sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier.name ?? certifier.username, amount, tramo, ceeFormUrl: ceeUrl });
            sendCEEFormLinkEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier.name ?? certifier.username, ceeFormUrl: ceeUrl, propertyAddress: cert.address ?? null });
          }
        } else if (tramo === 2 && cert.ownerEmail) {
          sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo, ceeFormUrl: null });
        }
      }
    }
  }

  res.json({ received: true });
});

// Authenticated: get pending manual payments
app.get("/api/payments/pending", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const pending = await db.select({
      id: payments.id,
      certificationId: payments.certificationId,
      amount: payments.amount,
      metodo: payments.metodo,
      tramo: payments.tramo,
      notas: payments.notas,
      estadoConfirmacion: payments.estadoConfirmacion,
      fechaNotificacion: payments.fechaNotificacion,
      ownerName: certifications.ownerName,
      address: certifications.address,
      city: certifications.city,
    })
      .from(payments)
      .leftJoin(certifications, eq(payments.certificationId, certifications.id))
      .where(and(
        eq(payments.userId, userId),
        eq(payments.estadoConfirmacion, "pendiente_confirmacion"),
      ))
      .orderBy(desc(payments.fechaNotificacion));

    res.json(pending);
  } catch {
    res.status(500).json({ message: "Error al obtener cobros pendientes" });
  }
});

// Authenticated: confirm manual payment
app.post("/api/payments/:id/confirm", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const paymentId = parseInt(req.params.id);

    const [payment] = await db.select().from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
      .limit(1);
    if (!payment) return res.status(404).json({ message: "Pago no encontrado" });

    await db.update(payments)
      .set({
        estadoConfirmacion: "confirmado",
        fechaConfirmacion: new Date(),
        confirmadoPor: userId,
        status: "succeeded",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    if (payment.certificationId) {
      const [cert] = await db.select().from(certifications).where(eq(certifications.id, payment.certificationId)).limit(1);
      const tramo = payment.tramo as 1 | 2;
      const amount = parseFloat(payment.amount as any);

      await db.update(certifications)
        .set({
          [`tramo${tramo}PaidAt`]: new Date(),
          workflowStatus: `pago_${tramo}_confirmado`,
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, payment.certificationId));

      const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (cert?.ownerEmail) {
        // Send payment confirmation
        if (tramo === 1) {
          // Auto-generate CEE form if not exists
          const ceeToken = cert.ceeToken ?? nanoid(32);
          if (!cert.ceeToken) {
            await db.update(certifications)
              .set({ ceeToken, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
              .where(eq(certifications.id, cert.id));
          }
          const host = req.headers.host ?? "localhost:5000";
          const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
          const ceeUrl = `${protocol}://${host}/formulario-cee/${ceeToken}`;
          sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo: 1, ceeFormUrl: ceeUrl });
          sendCEEFormLinkEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", ceeFormUrl: ceeUrl, propertyAddress: cert.address ?? null });
        } else {
          sendPagoConfirmadoEmail({ to: cert.ownerEmail, ownerName: cert.ownerName ?? "", certifierName: certifier?.name ?? "Tu certificador", amount, tramo: 2, ceeFormUrl: null });
        }
      }
    }

    // In-app notification
    if (payment.userId && payment.certificationId) {
      const [paymentCert] = await db.select().from(certifications).where(eq(certifications.id, payment.certificationId)).limit(1).catch(() => [null]);
      createNotification({
        userId: payment.userId,
        tipo: "pago_recibido",
        mensaje: `Pago confirmado: ${parseFloat(payment.amount as any).toFixed(2)} € (Tramo ${payment.tramo})${paymentCert?.ownerName ? ` · ${paymentCert.ownerName}` : ""}`,
        certificationId: payment.certificationId,
        metadata: { amount: payment.amount, tramo: payment.tramo, metodo: payment.metodo },
      }).catch(console.error);
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al confirmar pago" });
  }
});

// Authenticated: reject manual payment
app.post("/api/payments/:id/reject", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const paymentId = parseInt(req.params.id);
    const { motivo } = req.body;

    const [rejectedPayment] = await db.update(payments)
      .set({
        estadoConfirmacion: "rechazado",
        fechaConfirmacion: new Date(),
        confirmadoPor: userId,
        notas: motivo ? `RECHAZADO: ${motivo}` : "RECHAZADO",
        updatedAt: new Date(),
      })
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
      .returning();

    // In-app notification
    if (rejectedPayment?.certificationId) {
      const [rejCert] = await db.select().from(certifications).where(eq(certifications.id, rejectedPayment.certificationId)).limit(1).catch(() => [null]);
      createNotification({
        userId,
        tipo: "pago_fallido",
        mensaje: `Pago rechazado: ${parseFloat(rejectedPayment.amount as any).toFixed(2)} €${motivo ? ` — ${motivo}` : ""}${rejCert?.ownerName ? ` · ${rejCert.ownerName}` : ""}`,
        certificationId: rejectedPayment.certificationId,
        metadata: { amount: rejectedPayment.amount, motivo },
      }).catch(console.error);
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al rechazar pago" });
  }
});

}
