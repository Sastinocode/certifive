// @ts-nocheck
import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { users, waitlist, betaLeads, certifications, pricingRates } from "../../shared/schema";
import { authenticate } from "../auth";
import { sendBetaLeadConfirmation } from "../email";

export function registerMiscRoutes(app: Express) {
// ─── WAITLIST ────────────────────────────────────────────────────────────────

// Ensure waitlist table exists (auto-create on first run)
db.execute(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id SERIAL PRIMARY KEY,
    email TEXT,
    phone TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
  );
  CREATE INDEX IF NOT EXISTS waitlist_module_idx ON waitlist (module);
`).catch(() => {});

app.post("/api/waitlist", async (req: Request, res: Response) => {
  try {
    const { email, phone, module: mod } = req.body;
    if (!mod) return res.status(400).json({ message: "El campo 'module' es obligatorio" });
    if (!email && !phone) return res.status(400).json({ message: "Introduce un email o teléfono" });
    await db.insert(waitlist).values({ email: email?.trim() || null, phone: phone?.trim() || null, module: mod });
    const [{ count }] = await db.execute(`SELECT COUNT(*)::int AS count FROM waitlist WHERE module = '${mod.replace(/'/g, "''")}'`) as any;
    res.status(201).json({ success: true, count: Number(count) });
  } catch (e: any) {
    res.status(500).json({ message: "Error al guardar el registro", detail: e?.message });
  }
});

app.get("/api/waitlist/count/:module", async (req: Request, res: Response) => {
  try {
    const mod = req.params.module;
    const result = await db.execute(`SELECT COUNT(*)::int AS count FROM waitlist WHERE module = '${mod.replace(/'/g, "''")}'`) as any;
    const count = Number(result[0]?.count ?? result?.rows?.[0]?.count ?? 0);
    res.json({ count });
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
    const userId = (req as any).user.id;
    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
    const allPayments = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
    const records = [
      ...allInvoices.map(i => ({ type: "invoice", ...mapInvoice(i), paymentDate: i.paidAt ? new Date(i.paidAt).toISOString().split("T")[0] : undefined, collectionDate: i.issuedAt ? new Date(i.issuedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0] })),
      ...allPayments.map(p => ({ type: "collection", ...mapPaymentToCollection(p) })),
    ].sort((a, b) => new Date(b.createdAt ?? b.updatedAt ?? 0).getTime() - new Date(a.createdAt ?? a.updatedAt ?? 0).getTime());
    res.json(records);
  } catch {
    res.status(500).json({ message: "Error al obtener registros financieros" });
  }
});


// --- STATS ---

app.get("/api/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
    const userId = (req as any).user.id;
    const {
      publicSlug, condicionesServicio, plazoEntregaDias,
      bizumPhone, iban, enabledPaymentMethods,
      tramo1Percent, blockFormUntilPayment1, blockCertificateUntilPayment2, paymentReminderDays,
      invoiceSeriesPrefix, invoiceNextNumber, ivaPercent,
    } = req.body;

    // Validate slug uniqueness if provided
    if (publicSlug) {
      const [existing] = await db.select({ id: users.id })
        .from(users)
        .where(and(eq(users.publicSlug, publicSlug), eq(users.id, userId).not ? undefined as any : undefined))
        .limit(1);
      // Simple check: if another user has this slug, reject
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
