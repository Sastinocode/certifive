import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { certifications, formResponses, insertFormResponseSchema, users, documentos, pricingRates } from "../../shared/schema";
import { calcularPrecio } from "./pricing";
import { authenticate } from "../auth";
import { nanoid } from "nanoid";
import multer from "multer";
import path from "path";
import { uploadToCloudinary } from "../cloudinary";
import {
  sendFormLinkEmail, sendOwnerConfirmationEmail, sendCertifierNotification,
  sendTestEmail, sendSolicitudLinkEmail, sendNuevaSolicitudEmail,
  sendPresupuestoEmail, sendPresupuestoAceptadoEmail, sendModificacionPresupuestoEmail,
  sendPaymentLinkEmail, sendCEEFormLinkEmail, sendDocumentosRecibidosEmail,
  sendDocumentoRechazadoEmail,
} from "../email";
import { createNotification } from "../createNotification";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export function registerPublicFormRoutes(app: Express) {
// --- PUBLIC FORM (no auth required) ---

// Generate a shareable link for a certification
app.post("/api/certifications/:id/generate-link", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const certId = parseInt(req.params.id);

    const [cert] = await db.select().from(certifications)
      .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

    // Reuse existing token or create a new one
    const token = cert.formToken ?? nanoid(32);
    const [updated] = await db.update(certifications)
      .set({
        formToken: token,
        formStatus: cert.formStatus ?? "enviado",
        formSentAt: cert.formSentAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, certId))
      .returning();

    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const url = `${protocol}://${host}/form/${token}`;

    // Send form-link email to owner if we have their email address
    const ownerEmail = cert.ownerEmail ?? req.body.ownerEmail ?? null;
    if (ownerEmail) {
      const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      sendFormLinkEmail({
        to: ownerEmail,
        ownerName: cert.ownerName ?? "",
        certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
        certifierPhone: certifier?.phone ?? null,
        certifierCompany: certifier?.company ?? null,
        formUrl: url,
        propertyAddress: cert.address ? `${cert.address}, ${cert.city ?? ""}`.trim().replace(/,$/, "") : null,
      });
    }

    res.json({ token, url, formStatus: updated.formStatus, emailSent: !!ownerEmail });
  } catch {
    res.status(500).json({ message: "Error al generar el enlace" });
  }
});

// Public: load form data (no auth)
app.get("/api/form/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.formToken, token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Formulario no encontrado o enlace inválido" });

    if (cert.formStatus === "completado") {
      return res.json({ alreadyCompleted: true });
    }

    const [certifier] = await db.select({
      name: users.name,
      firstName: users.firstName,
      company: users.company,
    }).from(users).where(eq(users.id, cert.userId!)).limit(1);

    res.json({
      alreadyCompleted: false,
      certifier: {
        name: certifier?.name ?? certifier?.firstName ?? "Tu certificador",
        company: certifier?.company ?? null,
      },
      // Pre-fill known data so the owner only fills what's missing
      prefill: {
        ownerName: cert.ownerName ?? "",
        ownerEmail: cert.ownerEmail ?? "",
        ownerPhone: cert.ownerPhone ?? "",
        ownerDni: cert.ownerDni ?? "",
        address: cert.address ?? "",
        city: cert.city ?? "",
        postalCode: cert.postalCode ?? "",
        province: cert.province ?? "",
        propertyType: cert.propertyType ?? "",
        constructionYear: cert.constructionYear ?? "",
        totalArea: cert.totalArea ?? "",
        cadastralReference: cert.cadastralReference ?? "",
      },
    });
  } catch {
    res.status(500).json({ message: "Error al cargar el formulario" });
  }
});

// Public: mark form as opened
app.post("/api/form/:token/open", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.formToken, token))
      .limit(1);
    if (!cert || cert.formStatus === "completado") return res.json({ ok: true });

    // Only update if not already opened/completed
    if (cert.formStatus === "enviado") {
      await db.update(certifications)
        .set({ formStatus: "abierto", formOpenedAt: new Date(), updatedAt: new Date() })
        .where(eq(certifications.id, cert.id));
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true }); // Never fail silently on open-tracking
  }
});

// Public: submit form data
app.post("/api/form/:token/submit", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.formToken, token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
    if (cert.formStatus === "completado") {
      return res.status(409).json({ message: "Este formulario ya fue enviado" });
    }

    const {
      ownerName, ownerEmail, ownerPhone, ownerDni,
      address, city, postalCode, province,
      propertyType, constructionYear, totalArea, cadastralReference,
      energyData,
    } = req.body;

    // Update certification with owner-submitted data
    await db.update(certifications)
      .set({
        ownerName: ownerName || cert.ownerName,
        ownerEmail: ownerEmail || cert.ownerEmail,
        ownerPhone: ownerPhone || cert.ownerPhone,
        ownerDni: ownerDni || cert.ownerDni,
        address: address || cert.address,
        city: city || cert.city,
        postalCode: postalCode || cert.postalCode,
        province: province || cert.province,
        propertyType: propertyType || cert.propertyType,
        constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
        totalArea: totalArea || cert.totalArea,
        cadastralReference: cadastralReference || cert.cadastralReference,
        formData: { ...(cert.formData as object ?? {}), energyData },
        formStatus: "completado",
        formCompletedAt: new Date(),
        status: "En Proceso",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, cert.id));

    // Emails: owner confirmation + certifier notification (fire-and-forget)
    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    const finalOwnerEmail = ownerEmail || cert.ownerEmail;
    const finalOwnerName  = ownerName  || cert.ownerName  || "Propietario";
    const finalAddress    = address    || cert.address;
    const certifierName   = certifier?.name ?? certifier?.username ?? "Tu certificador";

    if (finalOwnerEmail) {
      sendOwnerConfirmationEmail({
        to: finalOwnerEmail,
        ownerName: finalOwnerName,
        certifierName,
        certifierPhone: certifier?.phone ?? null,
        certifierEmail: certifier?.email ?? null,
        propertyAddress: finalAddress ?? null,
      });
    }
    if (certifier?.email) {
      sendCertifierNotification({
        to: certifier.email,
        certifierName,
        ownerName: finalOwnerName,
        ownerPhone: ownerPhone || cert.ownerPhone || null,
        ownerEmail: finalOwnerEmail ?? null,
        propertyAddress: finalAddress ?? null,
        certificationId: cert.id,
      });
    }

    // Store immutable snapshot in form_responses for audit trail
    await db.insert(formResponses).values({
      certificationId: cert.id,
      ownerName: ownerName || null,
      ownerEmail: ownerEmail || null,
      ownerPhone: ownerPhone || null,
      ownerDni: ownerDni || null,
      address: address || null,
      city: city || null,
      postalCode: postalCode || null,
      province: province || null,
      propertyType: propertyType || null,
      constructionYear: constructionYear ? parseInt(constructionYear) : null,
      totalArea: totalArea || null,
      cadastralReference: cadastralReference || null,
      energyData: energyData ?? null,
      rawData: req.body,
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al enviar el formulario" });
  }
});

// --- TEST EMAIL (authenticated — remove before public launch) ---

app.post("/api/test-email", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const to = req.body.email || user?.email;
    if (!to) return res.status(400).json({ message: "No hay dirección de email configurada en tu cuenta" });
    await sendTestEmail(to);
    res.json({ message: `Email de prueba enviado a ${to}` });
  } catch {
    res.status(500).json({ message: "Error al enviar email de prueba" });
  }
});


// ─────────────────────────────────────────────────────────────────────────
// SOLICITUD FLOW  (Formulario 1 — tasación)
// ─────────────────────────────────────────────────────────────────────────

// Certifier generates solicitud token and sends link
app.post("/api/certifications/:id/generate-solicitud", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const certId = parseInt(req.params.id);

    const [cert] = await db.select().from(certifications)
      .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

    const token = cert.solicitudToken ?? nanoid(32);
    const [updated] = await db.update(certifications)
      .set({
        solicitudToken: token,
        solicitudStatus: cert.solicitudStatus ?? "enviado",
        solicitudSentAt: cert.solicitudSentAt ?? new Date(),
        workflowStatus: "solicitud_enviada",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, certId))
      .returning();

    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const url = `${protocol}://${host}/solicitud/${token}`;

    const ownerEmail = cert.ownerEmail ?? req.body.ownerEmail ?? null;
    if (ownerEmail) {
      const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      sendSolicitudLinkEmail({
        to: ownerEmail,
        ownerName: cert.ownerName ?? "",
        certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
        certifierPhone: certifier?.phone ?? null,
        certifierCompany: certifier?.company ?? null,
        solicitudUrl: url,
        propertyAddress: cert.address ? `${cert.address}, ${cert.city ?? ""}`.trimEnd().replace(/,$/, "") : null,
      });
    }

    res.json({ token, url, solicitudStatus: updated.solicitudStatus, emailSent: !!ownerEmail });
  } catch {
    res.status(500).json({ message: "Error al generar el enlace de solicitud" });
  }
});

// Public: Vía B — owner fills solicitud from certifier's public page (no existing cert)
app.post("/api/solicitud/nueva", async (req: Request, res: Response) => {
  try {
    const { certifierId, ownerName, ownerEmail, ownerPhone, ownerDni } = req.body;
    if (!certifierId || !ownerName) {
      return res.status(400).json({ message: "certifierId y nombre son obligatorios" });
    }

    const token = nanoid(32);
    const [cert] = await db.insert(certifications).values({
      userId: parseInt(certifierId),
      ownerName,
      ownerEmail: ownerEmail || null,
      ownerPhone: ownerPhone || null,
      ownerDni: ownerDni || null,
      solicitudToken: token,
      solicitudStatus: "abierto",
      solicitudSentAt: new Date(),
      solicitudOpenedAt: new Date(),
      workflowStatus: "solicitud_enviada",
      status: "Nuevo",
    }).returning();

    // Notify certifier
    const [certifier] = await db.select().from(users).where(eq(users.id, parseInt(certifierId))).limit(1);
    if (certifier?.email) {
      sendNuevaSolicitudEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName,
        ownerPhone: ownerPhone || null,
        ownerEmail: ownerEmail || null,
        propertyAddress: null,
        certificationId: cert.id,
      });
    }

    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const url = `${protocol}://${host}/solicitud/${token}`;
    res.json({ token, url, certificationId: cert.id });
  } catch {
    res.status(500).json({ message: "Error al crear solicitud" });
  }
});

// Public: get solicitud form data
app.get("/api/solicitud/:token", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.solicitudToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Enlace inválido o expirado" });

    const [certifier] = await db.select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      company: users.company,
      phone: users.phone,
      plazoEntregaDias: users.plazoEntregaDias,
    }).from(users).where(eq(users.id, cert.userId!)).limit(1);

    const completed = cert.solicitudStatus === "completado";
    res.json({
      completed,
      certifier: {
        id: certifier?.id,
        name: certifier?.name ?? certifier?.firstName ?? "Tu certificador",
        company: certifier?.company ?? null,
        phone: certifier?.phone ?? null,
        plazoEntregaDias: certifier?.plazoEntregaDias ?? 10,
      },
      prefill: {
        ownerName: cert.ownerName ?? "",
        ownerEmail: cert.ownerEmail ?? "",
        ownerPhone: cert.ownerPhone ?? "",
        ownerDni: cert.ownerDni ?? "",
        address: cert.address ?? "",
        city: cert.city ?? "",
        postalCode: cert.postalCode ?? "",
        province: cert.province ?? "",
        propertyType: cert.propertyType ?? "",
        constructionYear: cert.constructionYear ?? "",
        totalArea: cert.totalArea ?? "",
        numPlantas: cert.numPlantas ?? "",
        cadastralReference: cert.cadastralReference ?? "",
      },
    });
  } catch {
    res.status(500).json({ message: "Error al cargar formulario" });
  }
});

// Public: mark solicitud opened
app.post("/api/solicitud/:token/open", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.solicitudToken, req.params.token))
      .limit(1);
    if (!cert || cert.solicitudStatus === "completado") return res.json({ ok: true });
    if (cert.solicitudStatus === "enviado") {
      await db.update(certifications)
        .set({ solicitudStatus: "abierto", solicitudOpenedAt: new Date(), updatedAt: new Date() })
        .where(eq(certifications.id, cert.id));
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// Public: submit solicitud form (calculates price, updates cert)
app.post("/api/solicitud/:token/submit", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.solicitudToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
    if (cert.solicitudStatus === "completado") {
      return res.status(409).json({ message: "Este formulario ya fue enviado" });
    }

    const {
      ownerName, ownerEmail, ownerPhone, ownerDni,
      address, city, postalCode, province,
      propertyType, constructionYear, totalArea, numPlantas, cadastralReference,
    } = req.body;

    // Calculate estimated price
    let estimatedPrice: number | null = null;
    if (propertyType) {
      const [rate] = await db.select().from(pricingRates)
        .where(and(eq(pricingRates.userId, cert.userId!), eq(pricingRates.propertyType, propertyType), eq(pricingRates.isActive, true)))
        .limit(1);
      if (rate) {
        const p = calcularPrecio(
          parseFloat(rate.basePrice as any),
          totalArea ? parseFloat(totalArea) : null,
          province ?? null,
          rate.areaTiers,
          rate.provinceSurcharges,
        );
        estimatedPrice = p.total;
      }
    }

    const [updated] = await db.update(certifications)
      .set({
        ownerName: ownerName || cert.ownerName,
        ownerEmail: ownerEmail || cert.ownerEmail,
        ownerPhone: ownerPhone || cert.ownerPhone,
        ownerDni: ownerDni || cert.ownerDni,
        address: address || cert.address,
        city: city || cert.city,
        postalCode: postalCode || cert.postalCode,
        province: province || cert.province,
        propertyType: propertyType || cert.propertyType,
        constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
        totalArea: totalArea || cert.totalArea,
        numPlantas: numPlantas ? parseInt(numPlantas) : cert.numPlantas,
        cadastralReference: cadastralReference || cert.cadastralReference,
        estimatedPrice: estimatedPrice !== null ? String(estimatedPrice) : cert.estimatedPrice,
        solicitudStatus: "completado",
        solicitudCompletedAt: new Date(),
        workflowStatus: "solicitud_completada",
        status: "En Proceso",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, cert.id))
      .returning();

    // Notify certifier (email + in-app)
    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    if (certifier?.email) {
      sendNuevaSolicitudEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName: ownerName || cert.ownerName || "Propietario",
        ownerPhone: ownerPhone || cert.ownerPhone || null,
        ownerEmail: ownerEmail || cert.ownerEmail || null,
        propertyAddress: address ? `${address}, ${city ?? ""}`.trimEnd().replace(/,$/, "") : null,
        certificationId: cert.id,
      });
    }

    // In-app notification
    createNotification({
      userId: cert.userId!,
      tipo: "solicitud_completada",
      mensaje: `${ownerName || cert.ownerName || "Propietario"} completó el formulario de tasación`,
      certificationId: cert.id,
      metadata: { ownerName: ownerName || cert.ownerName, address: address || cert.address },
    }).catch(console.error);

    res.json({ ok: true, estimatedPrice });
  } catch {
    res.status(500).json({ message: "Error al enviar formulario" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PRESUPUESTO FLOW
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// PRESUPUESTO FLOW
// ─────────────────────────────────────────────────────────────────────────

// Suggest price from catastro data + pricing rates
app.get("/api/certifications/:id/suggest-price", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const certId = parseInt(req.params.id);

    const [cert] = await db.select().from(certifications)
      .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

    // Property data — prefer catastro values
    const propertyType = cert.propertyType ?? null;
    const totalAreaNum = cert.superficieTotalCatastro
      ? parseFloat(String(cert.superficieTotalCatastro))
      : (cert.totalArea ? parseFloat(cert.totalArea as any) : null);
    const province = cert.provinciaCatastro ?? cert.province ?? null;

    // Get all active pricing rates for this user
    const rates = await db.select().from(pricingRates)
      .where(and(eq(pricingRates.userId, userId), eq(pricingRates.isActive, true)));

    if (!rates.length) {
      return res.json({
        hasRate: false,
        message: "No tienes tarifas configuradas. Ve a Ajustes → Tarifas para establecer tus precios.",
        suggestedPrice: null,
      });
    }

    // Match rate by propertyType, fallback to first active rate
    let matchedRate: any = null;
    if (propertyType) {
      matchedRate = rates.find(r => r.propertyType === propertyType)
        ?? rates.find(r => (r.propertyType ?? "").toLowerCase().includes((propertyType ?? "").toLowerCase()));
    }
    if (!matchedRate) matchedRate = rates[0];

    const basePrice = parseFloat(matchedRate.basePrice as any);

    const pricing = calcularPrecio(
      basePrice,
      totalAreaNum,
      province,
      matchedRate.areaTiers,
      matchedRate.provinceSurcharges,
    );

    // pricePerM2 is stored as raw JSON column extra field (not in Drizzle schema)
    const pricePerM2 = (matchedRate as any).pricePerM2 ? parseFloat((matchedRate as any).pricePerM2) : 0;
    const m2Addition = (pricePerM2 > 0 && totalAreaNum) ? parseFloat((pricePerM2 * totalAreaNum).toFixed(2)) : 0;
    const suggestedPrice = parseFloat((pricing.total + m2Addition).toFixed(2));
    const deliveryDays = (matchedRate as any).deliveryDays ?? cert.plazoEntregaDias ?? null;

    return res.json({
      hasRate: true,
      suggestedPrice,
      breakdown: {
        basePrice: pricing.base,
        surchargeArea: pricing.surchargeArea,
        surchargeProvince: pricing.surchargeProvince,
        m2Addition,
        totalArea: totalAreaNum,
        pricePerM2,
        province,
      },
      matchedRate: {
        id: matchedRate.id,
        propertyType: matchedRate.propertyType,
        basePrice: matchedRate.basePrice,
        deliveryDays,
      },
      propertyInfo: { propertyType, totalArea: totalAreaNum, province },
    });
  } catch {
    res.status(500).json({ message: "Error al calcular precio sugerido" });
  }
});

// Certifier generates presupuesto
app.post("/api/certifications/:id/generate-presupuesto", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const certId = parseInt(req.params.id);
    const { finalPrice, plazoEntregaDias } = req.body;

    const [cert] = await db.select().from(certifications)
      .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

    const token = cert.presupuestoToken ?? nanoid(32);
    const payToken = cert.paymentToken ?? nanoid(32);

    // Calculate installments
    const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const tramo1Pct = certifier?.tramo1Percent ?? 25;
    const price = finalPrice ? parseFloat(finalPrice) : (cert.estimatedPrice ? parseFloat(cert.estimatedPrice as any) : 0);
    const tramo1Amt = parseFloat(((price * tramo1Pct) / 100).toFixed(2));
    const tramo2Amt = parseFloat((price - tramo1Amt).toFixed(2));

    await db.update(certifications)
      .set({
        presupuestoToken: token,
        paymentToken: payToken,
        presupuestoStatus: "enviado",
        presupuestoSentAt: new Date(),
        finalPrice: String(price),
        tramo1Amount: String(tramo1Amt),
        tramo2Amount: String(tramo2Amt),
        plazoEntregaDias: plazoEntregaDias ?? certifier?.plazoEntregaDias ?? 10,
        workflowStatus: "presupuesto_enviado",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, certId));

    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const url = `${protocol}://${host}/presupuesto/${token}`;

    const ownerEmail = cert.ownerEmail;
    if (ownerEmail) {
      sendPresupuestoEmail({
        to: ownerEmail,
        ownerName: cert.ownerName ?? "",
        certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
        certifierCompany: certifier?.company ?? null,
        presupuestoUrl: url,
        propertyAddress: cert.address ?? null,
        amount: price,
        plazoEntregaDias: plazoEntregaDias ?? certifier?.plazoEntregaDias ?? 10,
      });
    }

    res.json({ token, url, emailSent: !!ownerEmail });
  } catch {
    res.status(500).json({ message: "Error al generar presupuesto" });
  }
});

// Public: get presupuesto data
app.get("/api/presupuesto/:token", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.presupuestoToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado o enlace inválido" });

    const [certifier] = await db.select({
      name: users.name,
      firstName: users.firstName,
      company: users.company,
      licenseNumber: users.licenseNumber,
      dniNif: users.dniNif,
      address: users.address,
      city: users.city,
      phone: users.phone,
      email: users.email,
      condicionesServicio: users.condicionesServicio,
    }).from(users).where(eq(users.id, cert.userId!)).limit(1);

    res.json({
      status: cert.presupuestoStatus,
      cert: {
        ownerName: cert.ownerName,
        address: cert.address,
        city: cert.city,
        province: cert.province ?? cert.provinciaCatastro,
        propertyType: cert.propertyType,
        totalArea: cert.superficieTotalCatastro
          ? String(cert.superficieTotalCatastro)
          : (cert.totalArea ?? null),
        constructionYear: cert.constructionYear,
        cadastralReference: cert.cadastralReference,
        finalPrice: cert.finalPrice,
        tramo1Amount: cert.tramo1Amount,
        tramo2Amount: cert.tramo2Amount,
        plazoEntregaDias: cert.plazoEntregaDias,
      },
      certifier: {
        name: certifier?.name ?? certifier?.firstName ?? "Certificador",
        company: certifier?.company ?? null,
        licenseNumber: certifier?.licenseNumber ?? null,
        dniNif: certifier?.dniNif ?? null,
        address: certifier?.address ?? null,
        city: certifier?.city ?? null,
        phone: certifier?.phone ?? null,
        email: certifier?.email ?? null,
        condicionesServicio: certifier?.condicionesServicio ?? null,
      },
      paymentToken: cert.paymentToken,
    });
  } catch {
    res.status(500).json({ message: "Error al cargar presupuesto" });
  }
});

// Public: accept presupuesto
app.post("/api/presupuesto/:token/aceptar", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.presupuestoToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado" });
    if (cert.presupuestoStatus === "aceptado") {
      return res.json({ ok: true, paymentToken: cert.paymentToken });
    }

    await db.update(certifications)
      .set({
        presupuestoStatus: "aceptado",
        presupuestoAceptadoAt: new Date(),
        workflowStatus: "presupuesto_aceptado",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, cert.id));

    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    if (certifier?.email) {
      sendPresupuestoAceptadoEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName: cert.ownerName ?? "Propietario",
        propertyAddress: cert.address ?? null,
        amount: cert.finalPrice ? parseFloat(cert.finalPrice as any) : 0,
        certificationId: cert.id,
      });
    }

    // Send payment link to owner
    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const payUrl = `${protocol}://${host}/pay/${cert.paymentToken}`;

    if (cert.ownerEmail && cert.paymentToken) {
      sendPaymentLinkEmail({
        to: cert.ownerEmail,
        ownerName: cert.ownerName ?? "",
        certifierName: certifier?.name ?? "Tu certificador",
        paymentUrl: payUrl,
        amount: cert.tramo1Amount ? parseFloat(cert.tramo1Amount as any) : 0,
        tramo: 1,
        propertyAddress: cert.address ?? null,
      });
    }

    // In-app notification
    createNotification({
      userId: cert.userId!,
      tipo: "presupuesto_aceptado",
      mensaje: `${cert.ownerName || "El cliente"} aceptó el presupuesto de ${cert.finalPrice ? parseFloat(cert.finalPrice as any).toFixed(2) : "—"} €`,
      certificationId: cert.id,
      metadata: { ownerName: cert.ownerName, amount: cert.finalPrice },
    }).catch(console.error);

    res.json({ ok: true, paymentToken: cert.paymentToken });
  } catch {
    res.status(500).json({ message: "Error al aceptar presupuesto" });
  }
});

// Public: request presupuesto modification
app.post("/api/presupuesto/:token/modificar", async (req: Request, res: Response) => {
  try {
    const { motivo } = req.body;
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.presupuestoToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Presupuesto no encontrado" });

    await db.update(certifications)
      .set({
        presupuestoStatus: "modificacion_solicitada",
        modificacionSolicitada: true,
        modificacionMotivo: motivo || "",
        workflowStatus: "presupuesto_modificacion",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, cert.id));

    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    if (certifier?.email) {
      sendModificacionPresupuestoEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName: cert.ownerName ?? "Propietario",
        motivo: motivo || "",
        certificationId: cert.id,
      });
    }

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al solicitar modificación" });
  }
});


app.post("/api/certifications/:id/generate-cee-form", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const certId = parseInt(req.params.id);

    const [cert] = await db.select().from(certifications)
      .where(and(eq(certifications.id, certId), eq(certifications.userId, userId)))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Certificación no encontrada" });

    const token = cert.ceeToken ?? nanoid(32);
    await db.update(certifications)
      .set({ ceeToken: token, ceeFormStatus: "enviado", ceeFormSentAt: new Date(), workflowStatus: "formulario_cee_enviado", updatedAt: new Date() })
      .where(eq(certifications.id, certId));

    const host = req.headers.host ?? "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const url = `${protocol}://${host}/formulario-cee/${token}`;

    if (cert.ownerEmail) {
      const [certifier] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      sendCEEFormLinkEmail({
        to: cert.ownerEmail,
        ownerName: cert.ownerName ?? "",
        certifierName: certifier?.name ?? certifier?.username ?? "Tu certificador",
        ceeFormUrl: url,
        propertyAddress: cert.address ?? null,
      });
    }

    res.json({ token, url, emailSent: !!cert.ownerEmail });
  } catch {
    res.status(500).json({ message: "Error al generar enlace CEE" });
  }
});

// Public: get CEE form data
app.get("/api/formulario-cee/:token", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.ceeToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });

    // Check if payment 1 is required and confirmed
    const [certifier] = await db.select({
      name: users.name,
      company: users.company,
      phone: users.phone,
      email: users.email,
      blockFormUntilPayment1: users.blockFormUntilPayment1,
    }).from(users).where(eq(users.id, cert.userId!)).limit(1);

    const paymentBlocked = certifier?.blockFormUntilPayment1 && !cert.tramo1PaidAt;

    if (cert.ceeFormStatus === "completado") {
      return res.json({ completed: true });
    }

    if (paymentBlocked) {
      return res.json({
        paymentBlocked: true,
        paymentToken: cert.paymentToken,
        workflowStatus: cert.workflowStatus,
      });
    }

    // Get existing documents
    const docs = await db.select().from(documentos)
      .where(and(eq(documentos.certificationId, cert.id), eq(documentos.subidoPor, "cliente")))
      .orderBy(documentos.fechaSubida);

    res.json({
      completed: false,
      paymentBlocked: false,
      certifier: {
        name: certifier?.name ?? "Tu certificador",
        company: certifier?.company ?? null,
        phone: certifier?.phone ?? null,
      },
      prefill: {
        ownerName: cert.ownerName ?? "",
        ownerEmail: cert.ownerEmail ?? "",
        ownerPhone: cert.ownerPhone ?? "",
        ownerDni: cert.ownerDni ?? "",
        address: cert.address ?? "",
        city: cert.city ?? "",
        postalCode: cert.postalCode ?? "",
        province: cert.province ?? "",
        propertyType: cert.propertyType ?? "",
        constructionYear: cert.constructionYear ?? "",
        totalArea: cert.totalArea ?? "",
        numPlantas: cert.numPlantas ?? "",
        cadastralReference: cert.cadastralReference ?? "",
      },
      existingData: cert.formData ?? null,
      documents: docs,
    });
  } catch {
    res.status(500).json({ message: "Error al cargar formulario" });
  }
});

// Public: mark CEE form opened
app.post("/api/formulario-cee/:token/open", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.ceeToken, req.params.token))
      .limit(1);
    if (!cert || cert.ceeFormStatus === "completado") return res.json({ ok: true });
    if (cert.ceeFormStatus === "enviado") {
      await db.update(certifications)
        .set({ ceeFormStatus: "abierto", ceeFormOpenedAt: new Date(), updatedAt: new Date() })
        .where(eq(certifications.id, cert.id));
    }
    res.json({ ok: true });
  } catch {
    res.json({ ok: true });
  }
});

// Public: submit CEE form data
app.post("/api/formulario-cee/:token/submit", async (req: Request, res: Response) => {
  try {
    const [cert] = await db.select().from(certifications)
      .where(eq(certifications.ceeToken, req.params.token))
      .limit(1);
    if (!cert) return res.status(404).json({ message: "Formulario no encontrado" });
    if (cert.ceeFormStatus === "completado") {
      return res.status(409).json({ message: "Este formulario ya fue enviado" });
    }

    const {
      ownerName, ownerEmail, ownerPhone, ownerDni,
      address, city, postalCode, province,
      propertyType, constructionYear, totalArea, numPlantas, cadastralReference,
      // Constructive envelope
      cerramientoExterior, tipoVentanas, tipoMarcos, superficieAcristalada,
      anchoVentana, altoVentana, tienePersiana, tipoPersiana,
      // Position
      esUltimaPlanta, tieneLocalDebajo,
      // Heating
      calefaccionTipoInstalacion, tipoCalefaccion, anioCalefaccion, potenciaCalefaccion,
      // Legacy field kept for backward compat
      tieneCalefaccion,
      // ACS
      acsTipoInstalacion, tipoACS, tieneSolares, numPaneles, numOcupantes,
      // Cooling + lighting
      tieneAireAcondicionado, tipoAire, anioAire,
      tipoIluminacion, controlIluminacion,
      // Reforms
      tuvoReformas, reformas,
      // Climate zone (set by frontend from postal code)
      zonaClimatica,
    } = req.body;

    const formData = {
      constructivas: { cerramientoExterior, tipoVentanas, tipoMarcos, superficieAcristalada, anchoVentana, altoVentana, tienePersiana, tipoPersiana },
      calefaccion: { calefaccionTipoInstalacion: calefaccionTipoInstalacion ?? tieneCalefaccion, tipoCalefaccion, anioCalefaccion, potenciaCalefaccion },
      acs: { acsTipoInstalacion, tipoACS, tieneSolares, numPaneles, numOcupantes },
      refrigeracion: { tieneAireAcondicionado, tipoAire, anioAire },
      iluminacion: { tipoIluminacion, controlIluminacion },
      posicion: { esUltimaPlanta, tieneLocalDebajo },
      reformas: { tuvoReformas, lista: reformas ?? [] },
    };

    // Count uploaded documents
    const docs = await db.select().from(documentos)
      .where(and(eq(documentos.certificationId, cert.id), eq(documentos.subidoPor, "cliente")));

    await db.update(certifications)
      .set({
        ownerName: ownerName || cert.ownerName,
        ownerEmail: ownerEmail || cert.ownerEmail,
        ownerPhone: ownerPhone || cert.ownerPhone,
        ownerDni: ownerDni || cert.ownerDni,
        address: address || cert.address,
        city: city || cert.city,
        postalCode: postalCode || cert.postalCode,
        province: province || cert.province,
        propertyType: propertyType || cert.propertyType,
        constructionYear: constructionYear ? parseInt(constructionYear) : cert.constructionYear,
        totalArea: totalArea || cert.totalArea,
        numPlantas: numPlantas ? parseInt(numPlantas) : cert.numPlantas,
        cadastralReference: cadastralReference || cert.cadastralReference,
        formData: { ...(cert.formData as object ?? {}), ceeDetallado: formData },
        // New dedicated columns
        zonaClimatica: zonaClimatica || cert.zonaClimatica,
        esUltimaPlanta: esUltimaPlanta === "si" ? true : esUltimaPlanta === "no" ? false : cert.esUltimaPlanta,
        tieneLocalDebajo: tieneLocalDebajo === "si" ? true : tieneLocalDebajo === "no" ? false : cert.tieneLocalDebajo,
        calefaccionTipoInstalacion: calefaccionTipoInstalacion ?? tieneCalefaccion ?? cert.calefaccionTipoInstalacion,
        calefaccionSistema: tipoCalefaccion || cert.calefaccionSistema,
        acsTipoInstalacion: acsTipoInstalacion || cert.acsTipoInstalacion,
        acsSistema: tipoACS || cert.acsSistema,
        numOcupantes: numOcupantes ? parseInt(String(numOcupantes)) : cert.numOcupantes,
        tieneReformas: tuvoReformas === "si" ? true : tuvoReformas === "no" ? false : cert.tieneReformas,
        reformas: Array.isArray(reformas) && reformas.length > 0 ? reformas : cert.reformas,
        ceeFormStatus: "completado",
        ceeFormCompletedAt: new Date(),
        workflowStatus: "formulario_cee_completado",
        status: "En Proceso",
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, cert.id));

    // Notify certifier (email + in-app)
    const [certifier] = await db.select().from(users).where(eq(users.id, cert.userId!)).limit(1);
    if (certifier?.email) {
      sendDocumentosRecibidosEmail({
        to: certifier.email,
        certifierName: certifier.name ?? certifier.username,
        ownerName: ownerName || cert.ownerName || "Propietario",
        ownerPhone: ownerPhone || cert.ownerPhone || null,
        propertyAddress: address || cert.address || null,
        numDocumentos: docs.length,
        certificationId: cert.id,
      });
    }

    // In-app notification
    createNotification({
      userId: cert.userId!,
      tipo: "cee_completado",
      mensaje: `${ownerName || cert.ownerName || "El propietario"} completó el formulario CEE${docs.length > 0 ? ` y subió ${docs.length} documento${docs.length !== 1 ? "s" : ""}` : ""}`,
      certificationId: cert.id,
      metadata: { ownerName: ownerName || cert.ownerName, numDocs: docs.length },
    }).catch(console.error);

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al enviar formulario" });
  }
});

// Public: upload document (client side, during CEE form) — Cloudinary
const ceeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf", ".heic", ".heif", ".doc", ".docx"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

app.post("/api/formulario-cee/:token/upload/:certId", ceeUpload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No se subió ningún archivo" });
    const { tipoDoc = "otro" } = req.body;
    const certId = parseInt(req.params.certId);

    // Verify token matches certId
    const [cert] = await db.select({ id: certifications.id, ceeToken: certifications.ceeToken })
      .from(certifications).where(eq(certifications.id, certId)).limit(1);
    if (!cert || cert.ceeToken !== req.params.token) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Upload to Cloudinary
    const { secure_url, public_id } = await uploadToCloudinary(req.file.buffer, {
      folder: `certifive/certs/${certId}/cee`,
    });

    const [doc] = await db.insert(documentos).values({
      certificationId: certId,
      nombreOriginal:  req.file.originalname,
      nombreArchivo:   public_id,   // Cloudinary public_id
      path:            secure_url,  // Cloudinary HTTPS URL
      mimeType:        req.file.mimetype,
      tamano:          req.file.size,
      tipoDoc,
      subidoPor:       "cliente",
      estadoRevision:  "pendiente",
    }).returning();

    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al subir archivo" });
  }
});

}
