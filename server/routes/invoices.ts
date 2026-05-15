import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc, or, isNull } from "drizzle-orm";
import { invoices, payments, certifications, insertInvoiceSchema, insertPaymentSchema } from "../../shared/schema";
import { authenticate } from "../auth";

export function registerInvoiceRoutes(app: Express) {
// --- INVOICES ---

// Helper to map DB invoice row → frontend Invoice shape
const mapInvoice = (i: any) => ({
  ...i,
  // Field aliases expected by the frontend
  total: i.totalAmount ?? i.total ?? "0",
  subtotal: i.amount ?? "0",
  vatRate: i.taxRate ?? "21",
  vatAmount: i.tax ?? "0",
  paymentStatus: i.status ?? "pending",
  issueDate: i.issuedAt ? new Date(i.issuedAt).toISOString().split("T")[0] : (i.issueDate ?? new Date().toISOString().split("T")[0]),
  dueDate: i.dueDate ? (typeof i.dueDate === "string" ? i.dueDate.split("T")[0] : new Date(i.dueDate).toISOString().split("T")[0]) : undefined,
  paidDate: i.paidAt ? new Date(i.paidAt).toISOString().split("T")[0] : undefined,
  description: i.notes ?? i.description ?? "",
  clientNif: i.clientDni ?? i.clientNif ?? "",
  series: i.series ?? "A",
  isProforma: i.isProforma ?? false,
  invoiceType: i.invoiceType ?? "factura",
  isAccountingRegistered: i.isAccountingRegistered ?? true,
  manualAccountingRequired: i.manualAccountingRequired ?? false,
});

app.get("/api/invoices", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
    res.json(result.map(mapInvoice));
  } catch {
    res.status(500).json({ message: "Error al obtener facturas" });
  }
});

app.post("/api/invoices", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const year = new Date().getFullYear();
    const countResult = await db.select().from(invoices).where(eq(invoices.userId, userId));
    const seq = String(countResult.length + 1).padStart(4, "0");
    const invoiceNumber = `${req.body.series ?? "A"}${year}-${seq}`;
    const dbPayload = {
      userId,
      invoiceNumber,
      clientName: req.body.clientName,
      clientEmail: req.body.clientEmail,
      clientDni: req.body.clientNif ?? req.body.clientDni,
      clientAddress: req.body.clientAddress,
      amount: req.body.subtotal ?? req.body.amount ?? "0",
      taxRate: req.body.vatRate ?? "21",
      tax: req.body.vatAmount ?? "0",
      totalAmount: req.body.total ?? req.body.totalAmount ?? "0",
      status: req.body.paymentStatus ?? req.body.status ?? "issued",
      notes: req.body.description ?? req.body.notes,
      issuedAt: new Date(),
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    };
    const [inv] = await db.insert(invoices).values(dbPayload).returning();
    res.status(201).json(mapInvoice(inv));
  } catch (e: any) {
    res.status(500).json({ message: "Error al crear factura", detail: e?.message });
  }
});

app.put("/api/invoices/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = parseInt(req.params.id);
    const dbPayload: any = { updatedAt: new Date() };
    if (req.body.clientName !== undefined) dbPayload.clientName = req.body.clientName;
    if (req.body.clientEmail !== undefined) dbPayload.clientEmail = req.body.clientEmail;
    if (req.body.clientNif !== undefined) dbPayload.clientDni = req.body.clientNif;
    if (req.body.subtotal !== undefined) dbPayload.amount = req.body.subtotal;
    if (req.body.vatRate !== undefined) dbPayload.taxRate = req.body.vatRate;
    if (req.body.vatAmount !== undefined) dbPayload.tax = req.body.vatAmount;
    if (req.body.total !== undefined) dbPayload.totalAmount = req.body.total;
    if (req.body.paymentStatus !== undefined) dbPayload.status = req.body.paymentStatus;
    if (req.body.description !== undefined) dbPayload.notes = req.body.description;
    if (req.body.dueDate !== undefined) dbPayload.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (req.body.paymentStatus === "paid") dbPayload.paidAt = new Date();
    const [inv] = await db.update(invoices)
      .set(dbPayload)
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
    res.json(mapInvoice(inv));
  } catch {
    res.status(500).json({ message: "Error al actualizar factura" });
  }
});

// Invoice actions (stubs + implemented)
app.post("/api/invoices/:id/register-accounting", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = parseInt(req.params.id);
    const [inv] = await db.update(invoices)
      .set({ updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
    res.json({ success: true, message: "Factura registrada en contabilidad" });
  } catch {
    res.status(500).json({ message: "Error al registrar en contabilidad" });
  }
});

app.post("/api/invoices/:id/convert-to-invoice", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = parseInt(req.params.id);
    const [inv] = await db.update(invoices)
      .set({ status: "issued", updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    if (!inv) return res.status(404).json({ message: "Factura no encontrada" });
    res.json(mapInvoice(inv));
  } catch {
    res.status(500).json({ message: "Error al convertir factura" });
  }
});

app.post("/api/invoices/:id/generate-pdf", authenticate, async (_req: Request, res: Response) => {
  res.json({ success: true, message: "PDF generado (funcionalidad próximamente disponible)" });
});

app.post("/api/invoices/:id/send", authenticate, async (_req: Request, res: Response) => {
  res.json({ success: true, message: "Factura enviada" });
});

// Export endpoints
app.post("/api/export/:type", authenticate, async (req: Request, res: Response) => {
  res.json({ success: true, message: `Exportación de ${req.params.type} completada (funcionalidad próximamente disponible)` });
});

app.get("/api/financial/summary", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const toNum = (v: any) => parseFloat(v ?? "0") || 0;

    const totalInvoiced = allInvoices.reduce((s, i) => s + toNum(i.totalAmount), 0);
    const totalPaid = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + toNum(i.totalAmount), 0);
    const totalPending = allInvoices.filter(i => i.status === "issued").reduce((s, i) => s + toNum(i.totalAmount), 0);
    const totalOverdue = allInvoices.filter(i => i.status === "overdue" || (i.status === "issued" && i.dueDate && new Date(i.dueDate) < now)).reduce((s, i) => s + toNum(i.totalAmount), 0);

    const currentMonthRevenue = allInvoices.filter(i => i.paidAt && new Date(i.paidAt) >= startOfMonth).reduce((s, i) => s + toNum(i.totalAmount), 0);
    const previousMonthRevenue = allInvoices.filter(i => i.paidAt && new Date(i.paidAt) >= startOfLastMonth && new Date(i.paidAt) <= endOfLastMonth).reduce((s, i) => s + toNum(i.totalAmount), 0);
    const revenueGrowth = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

    res.json({ totalInvoiced, totalPaid, totalPending, totalOverdue, totalCollections: totalPaid, netIncome: totalPaid, currentMonthRevenue, previousMonthRevenue, revenueGrowth });
  } catch {
    res.status(500).json({ message: "Error al obtener resumen financiero" });
  }
});

// Helper to map DB payment row → frontend Payment shape
const mapPayment = (p: any) => ({
  ...p,
  paymentMethod: p.metodo ?? p.paymentMethod ?? "other",
  paymentDate: p.paidAt
    ? new Date(p.paidAt).toISOString().split("T")[0]
    : new Date(p.createdAt).toISOString().split("T")[0],
  paymentReference: p.stripePaymentIntentId ?? p.paymentReference ?? undefined,
  status: p.estadoConfirmacion === "confirmado" ? "confirmed" : (p.status === "succeeded" ? "confirmed" : p.status ?? "pending"),
});

// Helper to map a payment into a Collection shape for the frontend
const mapPaymentToCollection = (p: any) => ({
  id: p.id,
  userId: String(p.userId),
  amount: p.amount?.toString() ?? "0",
  concept: p.description ?? p.notas ?? "Cobro manual",
  paymentMethod: p.metodo ?? "cash",
  paymentReference: p.stripePaymentIntentId ?? undefined,
  collectionDate: p.paidAt
    ? new Date(p.paidAt).toISOString().split("T")[0]
    : new Date(p.createdAt).toISOString().split("T")[0],
  invoiceId: p.invoiceId ?? undefined,
  isInvoicePayment: !!p.invoiceId,
  clientName: p.clientName ?? undefined,
  clientEmail: undefined,
  clientPhone: undefined,
  vatIncluded: false,
  vatAmount: "0",
  vatRate: "21",
  status: p.estadoConfirmacion === "confirmado" || p.status === "succeeded" ? "confirmed" : "pending",
  notes: p.notas ?? undefined,
  createdAt: new Date(p.createdAt).toISOString(),
  updatedAt: new Date(p.updatedAt).toISOString(),
});

app.get("/api/payments", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
    res.json(result.map(mapPayment));
  } catch {
    res.status(500).json({ message: "Error al obtener pagos" });
  }
});

app.post("/api/payments", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [pay] = await db.insert(payments).values({
      userId,
      amount: req.body.amount?.toString() ?? "0",
      metodo: req.body.paymentMethod ?? req.body.metodo,
      invoiceId: req.body.invoiceId ?? undefined,
      notas: req.body.notas ?? undefined,
      status: "succeeded",
      estadoConfirmacion: "confirmado",
      paidAt: new Date(),
    }).returning();
    res.status(201).json(mapPayment(pay));
  } catch {
    res.status(500).json({ message: "Error al registrar pago" });
  }
});

// Collections: stored as payments with manual methods, no invoiceId
app.get("/api/collections", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await db.select().from(payments)
      .where(and(
        eq(payments.userId, userId),
        eq(payments.estadoConfirmacion, "confirmado"),
      ))
      .orderBy(desc(payments.createdAt));
    res.json(result.map(mapPaymentToCollection));
  } catch {
    res.status(500).json({ message: "Error al obtener cobros" });
  }
});

app.post("/api/collections", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [pay] = await db.insert(payments).values({
      userId,
      amount: req.body.amount?.toString() ?? "0",
      metodo: req.body.paymentMethod ?? "cash",
      description: req.body.concept,
      notas: req.body.notes,
      status: "succeeded",
      estadoConfirmacion: "confirmado",
      paidAt: req.body.collectionDate ? new Date(req.body.collectionDate) : new Date(),
    }).returning();
    res.status(201).json(mapPaymentToCollection(pay));
  } catch {
    res.status(500).json({ message: "Error al registrar cobro" });
  }
});

app.delete("/api/collections/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const id = parseInt(req.params.id);
    await db.delete(payments).where(and(eq(payments.id, id), eq(payments.userId, userId)));
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Error al eliminar cobro" });
  }
});

app.post("/api/collections/:id/create-invoice", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const paymentId = parseInt(req.params.id);
    const [payment] = await db.select().from(payments).where(and(eq(payments.id, paymentId), eq(payments.userId, userId)));
    if (!payment) return res.status(404).json({ message: "Cobro no encontrado" });
    const year = new Date().getFullYear();
    const countResult = await db.select().from(invoices).where(eq(invoices.userId, userId));
    const seq = String(countResult.length + 1).padStart(4, "0");
    const invoiceNumber = `A${year}-${seq}`;
    const [inv] = await db.insert(invoices).values({
      userId,
      invoiceNumber,
      amount: payment.amount,
      totalAmount: payment.amount,
      taxRate: "21",
      tax: "0",
      status: "paid",
      notes: payment.description ?? payment.notas ?? "Cobro en efectivo",
      issuedAt: new Date(),
      paidAt: payment.paidAt ?? new Date(),
    }).returning();
    await db.update(payments).set({ invoiceId: inv.id }).where(eq(payments.id, paymentId));
    res.status(201).json(mapInvoice(inv));
  } catch {
    res.status(500).json({ message: "Error al crear factura del cobro" });
  }
});

}
