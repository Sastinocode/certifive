import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, count } from "drizzle-orm";
import { users, waitlist, betaLeads, certifications, pricingRates, invoices, payments, folders } from "../../shared/schema";
import { authenticate } from "../auth";
import { sendBetaLeadConfirmation } from "../email";

export function registerMiscRoutes(app: Express) {
// ─── WAITLIST ────────────────────────────────────────────────────────────────

app.post("/api/waitlist", async (req: Request, res: Response) => {
  try {
    const { email, phone, module: mod } = req.body;
    if (!mod) return res.status(400).json({ message: "El campo 'module' es obligatorio" });
    if (!email && !phone) return res.status(400).json({ message: "Introduce un email o teléfono" });
    await db.insert(waitlist).values({ email: email?.trim() || null, phone: phone?.trim() || null, module: mod });
    const [{ value }] = await db.select({ value: count() }).from(waitlist).where(eq(waitlist.module, mod));
    res.status(201).json({ success: true, count: Number(value) });
  } catch (e: any) {
    res.status(500).json({ message: "Error al guardar el registro", detail: e?.message });
  }
});

app.get("/api/waitlist/count/:module", async (req: Request, res: Response) => {
  try {
    const mod = req.params.module;
    const [{ value }] = await db.select({ value: count() }).from(waitlist).where(eq(waitlist.module, mod));
    res.json({ count: Number(value) });
  } catch {
    res.json({ count: 0 });
  }
});

// Legacy stub (kept for backwards compat)
app.post("/api/notify-waitlist", async (req: Request, res: Response) => {
  res.json({ success: true, message: "Email registrado en lista de espera" });
});

app.get("/api/manager/financial-records", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
    const allPayments = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
    res.json({ invoices: allInvoices, payments: allPayments });
  } catch {
    res.status(500).json({ message: "Error al obtener registros financieros" });
  }
});


// --- STATS ---

app.get("/api/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const allCerts = await db.select().from(certifications).where(eq(certifications.userId, userId));
    const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));

    res.json({
      totalCertifications: allCerts.length,
      activeCertifications: allCerts.filter(c => !c.isArchived).length,
      archivedCertifications: allCerts.filter(c => c.isArchived).length,
      totalFolders: allFolders.length,
      totalInvoices: allInvoices.length,
      byStatus: {
        Nuevo: allCerts.filter(c => c.status === "Nuevo").length,
        "En Proceso": allCerts.filter(c => c.status === "En Proceso").length,
        Finalizado: allCerts.filter(c => c.status === "Finalizado").length,
      },
    });
  } catch {
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
});


// ─────────────────────────────────────────────────────────────────────────
// USER SETTINGS (payment + service)
// ─────────────────────────────────────────────────────────────────────────

app.put("/api/auth/user/settings", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      publicSlug, condicionesServicio, plazoEntregaDias,
      bizumPhone, iban, enabledPaymentMethods,
      tramo1Percent, blockFormUntilPayment1, blockCertificateUntilPayment2, paymentReminderDays,
      invoiceSeriesPrefix, invoiceNextNumber, ivaPercent,
    } = req.body;

    // Validate slug uniqueness if provided
    if (publicSlug) {
      // Check: if another user has this slug, reject
      const [conflicting] = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.publicSlug, publicSlug))
        .limit(1);
      if (conflicting && conflicting.id !== userId) {
        return res.status(409).json({ message: "Ese slug ya está en uso. Elige otro." });
      }
    }

    const [updated] = await db.update(users)
      .set({
        publicSlug: publicSlug || null,
        condicionesServicio: condicionesServicio || null,
        plazoEntregaDias: plazoEntregaDias ?? 10,
        bizumPhone: bizumPhone || null,
        iban: iban || null,
        enabledPaymentMethods: enabledPaymentMethods ?? null,
        tramo1Percent: tramo1Percent ?? 25,
        blockFormUntilPayment1: !!blockFormUntilPayment1,
        blockCertificateUntilPayment2: !!blockCertificateUntilPayment2,
        paymentReminderDays: paymentReminderDays ?? 3,
        invoiceSeriesPrefix: invoiceSeriesPrefix || "FAC",
        invoiceNextNumber: invoiceNextNumber ?? 1,
        ivaPercent: ivaPercent ?? "21",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    const { password: _, emailVerificationToken: __, ...safe } = updated;
    res.json(safe);
  } catch {
    res.status(500).json({ message: "Error al guardar configuración" });
  }
});


// ─────────────────────────────────────────────────────────────────────────
// PUBLIC CERTIFIER LANDING  GET /api/c/:slug
// ─────────────────────────────────────────────────────────────────────────

app.get("/api/c/:slug", async (req: Request, res: Response) => {
  try {
    const [certifier] = await db.select({
      id: users.id,
      name: users.name,
      firstName: users.firstName,
      company: users.company,
      licenseNumber: users.licenseNumber,
      phone: users.phone,
      email: users.email,
      province: users.province,
      city: users.city,
      condicionesServicio: users.condicionesServicio,
      plazoEntregaDias: users.plazoEntregaDias,
      publicSlug: users.publicSlug,
    }).from(users).where(eq(users.publicSlug, req.params.slug)).limit(1);

    if (!certifier) return res.status(404).json({ message: "Certificador no encontrado" });
    res.json(certifier);
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PRICING CALCULATE  POST /api/pricing/calculate
// ─────────────────────────────────────────────────────────────────────────

app.post("/api/pricing/calculate", async (req: Request, res: Response) => {
  try {
    const { propertyType, area, province } = req.body;
    if (!propertyType || !area) {
      return res.status(400).json({ message: "Tipo de inmueble y superficie requeridos" });
    }

    const [rate] = await db.select()
      .from(pricingRates)
      .where(eq(pricingRates.propertyType, propertyType))
      .limit(1);

    if (!rate) {
      return res.status(404).json({ message: "No se encontró tarifa para estos parámetros" });
    }

    const basePrice = parseFloat(String(rate.basePrice ?? 0));
    const total = Math.round(basePrice * 100) / 100;

    res.json({ basePrice, area, total });
  } catch {
    res.status(500).json({ message: "Error al calcular precio" });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC ORDER TRACKING  GET /api/solicitudes/seguimiento/:token
// ─────────────────────────────────────────────────────────────────────────

app.get("/api/solicitudes/seguimiento/:token", async (req: Request, res: Response) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ message: "Token requerido" });

  // TODO: replace with real DB lookup by token
  const mock = {
    paso:         3,
    totalPasos:   4,
    progreso:     70,
    estado:       "Certificado en redacción",
    subtitulo:    "El técnico ya ha realizado la visita. Estamos redactando tu certificado y lo registraremos en la CCAA.",
    entrega:      "5-6 jun",
    numero:       "CTF-2026-04821",
    inmueble:     "Vivienda · 84 m²",
    direccion:    "Calle Mayor 14, 4ºB",
    ciudad:       "Madrid · 28013",
    finalidad:    "Venta",
    calificacion: "C",
    pdfUrl:       null,
    total:        129,
    timeline: [
      {
        done: true, current: false, pending: false,
        label: "Solicitud y pago confirmados",
        sub:   "31 may · 18:42 · Pago de 129 € recibido",
        badge: null,
        detail: null,
      },
      {
        done: true, current: false, pending: false,
        label: "Visita técnica realizada",
        sub:   "4 jun · 10:15 · Técnico: Javier Ruiz (COIIM 21548)",
        badge: "Datos tomados correctamente · 84 m²",
        detail: null,
      },
      {
        done: false, current: true, pending: false,
        label: "Redacción del certificado",
        sub:   "En curso · estimado 5 jun",
        badge: null,
        detail: "Nuestro equipo está calculando la calificación energética y preparando el informe. Te avisaremos cuando esté listo para registrar.",
      },
      {
        done: false, current: false, pending: true,
        label: "Registro en la CCAA y entrega",
        sub:   "Pendiente · estimado 5-6 jun",
        badge: null,
        detail: null,
      },
    ],
  };

  res.json(mock);
});

// ── BETA LEADS ──────────────────────────────────────────────────────────────

// POST /api/beta-leads — landing page registration
app.post("/api/beta-leads", async (req, res) => {
  const { nombre, email, telefono, provincia, certificacionesMes } = req.body ?? {};

  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({ message: "El nombre es obligatorio" });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ message: "El email no es válido" });
  }

  try {
    // Check for duplicate — silently succeed so we don't expose who's registered
    const existing = await db
      .select({ id: betaLeads.id })
      .from(betaLeads)
      .where(eq(betaLeads.email, email.trim().toLowerCase()))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(betaLeads).values({
        nombre:             nombre.trim(),
        email:              email.trim().toLowerCase(),
        telefono:           telefono?.trim() || null,
        provincia:          provincia || null,
        certificacionesMes: certificacionesMes ? parseInt(certificacionesMes) : null,
      });
    }

    // Always send confirmation (even on duplicate — user may have refreshed)
    sendBetaLeadConfirmation({ to: email.trim().toLowerCase(), nombre: nombre.trim() }).catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error("[beta-leads] Error:", err);
    res.status(500).json({ message: "Error al guardar el registro" });
  }
});
}
