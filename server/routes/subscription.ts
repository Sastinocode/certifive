import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../shared/schema";
import { authenticate } from "../auth";
import Stripe from "stripe";

// Initialise Stripe only when the secret key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Map plan names → Stripe Price IDs
// Supports both the old env var names (PRO/ENTERPRISE) and the new ones
// (PROFESIONAL/EMPRESA) so no migration is needed.
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  basico:      process.env.STRIPE_PRICE_BASICO,
  profesional: process.env.STRIPE_PRICE_PROFESIONAL ?? process.env.STRIPE_PRICE_PRO,
  empresa:     process.env.STRIPE_PRICE_EMPRESA     ?? process.env.STRIPE_PRICE_ENTERPRISE,
  pay_per_use: process.env.STRIPE_PRICE_PAY_PER_USE,
  // legacy aliases kept for backwards compatibility
  pro:         process.env.STRIPE_PRICE_PROFESIONAL ?? process.env.STRIPE_PRICE_PRO,
  enterprise:  process.env.STRIPE_PRICE_EMPRESA     ?? process.env.STRIPE_PRICE_ENTERPRISE,
};

export function registerSubscriptionRoutes(app: Express) {

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/subscription  —  current subscription state for the logged-in user
// Also aliased as GET /api/stripe/subscription
// ──────────────────────────────────────────────────────────────────────────────
async function getSubscription(req: Request, res: Response) {
  try {
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    let stripeData: any = null;
    if (stripe && user.stripeSubscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ["default_payment_method"],
        });
        stripeData = {
          status: sub.status,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
        };
        // Sync DB if status changed
        if (sub.status !== user.subscriptionStatus) {
          await db.update(users).set({
            subscriptionStatus: sub.status,
            subscriptionCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          }).where(eq(users.id, userId));
        }
      } catch {
        // Stripe call failed — fall through to DB data
      }
    }

    res.json({
      plan: user.subscriptionPlan ?? "free",
      status: stripeData?.status ?? user.subscriptionStatus ?? "active",
      currentPeriodEnd: stripeData?.currentPeriodEnd ?? (user.subscriptionCurrentPeriodEnd?.toISOString() ?? null),
      cancelAtPeriodEnd: stripeData?.cancelAtPeriodEnd ?? false,
      cancelAt: stripeData?.cancelAt ?? null,
      stripeCustomerId: user.stripeCustomerId,
      stripeConfigured: !!stripe,
      priceIds: PLAN_PRICE_IDS,
    });
  } catch {
    res.status(500).json({ message: "Error al obtener suscripción" });
  }
}

app.get("/api/subscription", authenticate, getSubscription);
app.get("/api/stripe/subscription", authenticate, getSubscription);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/portal  —  open Stripe Customer Portal
// ──────────────────────────────────────────────────────────────────────────────
app.post("/api/subscription/portal", authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado. Añade STRIPE_SECRET_KEY al .env" });
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? user.firstName ?? user.username ?? undefined,
        metadata: { userId: String(userId) },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const returnUrl = req.body.returnUrl ?? `${req.headers.origin ?? "https://certifive.es"}/configuracion`;
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[subscription/portal]", err.message);
    res.status(500).json({ message: err.message ?? "Error al abrir el portal de suscripción" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/checkout  —  start a new subscription (7-day trial)
// Also aliased as POST /api/stripe/create-checkout-session
// Body: { plan: "basico" | "profesional" | "empresa" | "pay_per_use", returnUrl? }
// ──────────────────────────────────────────────────────────────────────────────
async function createCheckout(req: Request, res: Response) {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado. Añade STRIPE_SECRET_KEY al .env" });
    const { plan, returnUrl } = req.body;
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) {
      return res.status(400).json({
        message: `Plan '${plan}' no tiene un Price ID configurado. Añade STRIPE_PRICE_${plan.toUpperCase()} en el .env`,
      });
    }

    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? user.firstName ?? user.username ?? undefined,
        metadata: { userId: String(userId) },
      });
      customerId = customer.id;
      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId));
    }

    const origin = req.headers.origin ?? "https://certifive.es";
    const base   = returnUrl ?? origin;

    const isPayPerUse = plan === "pay_per_use";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      // 7-day free trial for all plans except pay-per-use
      ...(isPayPerUse ? {} : {
        subscription_data: { trial_period_days: 7 },
      }),
      success_url: `${base}/success?subscription=success&plan=${plan}`,
      cancel_url:  `${base}/cancel?subscription=canceled`,
      metadata: { userId: String(userId), plan },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[subscription/checkout]", err.message);
    res.status(500).json({ message: err.message ?? "Error al iniciar el checkout" });
  }
}

app.post("/api/subscription/checkout", authenticate, createCheckout);
app.post("/api/stripe/create-checkout-session", authenticate, createCheckout);

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/cancel  —  cancel subscription at period end
// Also aliased as POST /api/stripe/cancel
// ──────────────────────────────────────────────────────────────────────────────
async function cancelSubscription(req: Request, res: Response) {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    if (!user.stripeSubscriptionId) return res.status(400).json({ message: "No hay suscripción activa" });

    // Cancel at period end (does NOT revoke access immediately)
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await db.update(users).set({
      subscriptionCanceledAt: new Date(),
    }).where(eq(users.id, userId));

    res.json({
      message: "Suscripción programada para cancelar al final del periodo",
      cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null,
    });
  } catch (err: any) {
    console.error("[subscription/cancel]", err.message);
    res.status(500).json({ message: err.message ?? "Error al cancelar la suscripción" });
  }
}

app.post("/api/subscription/cancel", authenticate, cancelSubscription);
app.post("/api/stripe/cancel", authenticate, cancelSubscription);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/subscription/invoices  —  list Stripe invoices
// ──────────────────────────────────────────────────────────────────────────────
app.get("/api/subscription/invoices", authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.json({ invoices: [], stripeConfigured: false });
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.stripeCustomerId) return res.json({ invoices: [], stripeConfigured: true });

    const list = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 24 });
    const invoices = list.data.map((inv: any) => ({
      id:          inv.id,
      number:      inv.number,
      amount:      inv.amount_paid / 100,
      currency:    inv.currency,
      status:      inv.status,
      created:     new Date(inv.created * 1000).toISOString(),
      pdfUrl:      inv.invoice_pdf,
      hostedUrl:   inv.hosted_invoice_url,
      description: inv.description ?? inv.lines?.data?.[0]?.description ?? null,
    }));
    res.json({ invoices, stripeConfigured: true });
  } catch (err: any) {
    console.error("[subscription/invoices]", err.message);
    res.status(500).json({ message: "Error al cargar facturas de Stripe" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/subscription/webhook  —  handle Stripe subscription lifecycle events
// Also aliased as POST /api/stripe/webhook
// Configure in Stripe Dashboard → Developers → Webhooks
// Events to subscribe: customer.subscription.created, customer.subscription.updated,
//   customer.subscription.deleted, invoice.payment_failed
// ──────────────────────────────────────────────────────────────────────────────
async function handleWebhook(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });

  const sig    = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
  let event: any;

  try {
    const raw = (req as any).rawBody ?? JSON.stringify(req.body);
    event = secret
      ? stripe.webhooks.constructEvent(raw, sig, secret)
      : JSON.parse(raw);
  } catch {
    return res.status(400).json({ message: "Webhook signature inválida" });
  }

  const obj = event.data?.object;
  const customerId = obj?.customer;
  if (!customerId) return res.json({ received: true });

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) return res.json({ received: true });

  const planByPrice =
    Object.entries(PLAN_PRICE_IDS).find(([, pid]) => pid === obj.items?.data?.[0]?.price?.id)?.[0] ?? null;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await db.update(users).set({
        stripeSubscriptionId:        obj.id,
        stripePriceId:               obj.items?.data?.[0]?.price?.id ?? null,
        subscriptionPlan:            planByPrice ?? "profesional",
        subscriptionStatus:          obj.status,
        subscriptionCurrentPeriodEnd: obj.current_period_end
          ? new Date(obj.current_period_end * 1000)
          : null,
        subscriptionCanceledAt: obj.canceled_at
          ? new Date(obj.canceled_at * 1000)
          : null,
      }).where(eq(users.id, user.id));
      break;

    case "customer.subscription.deleted":
      await db.update(users).set({
        stripeSubscriptionId: null,
        subscriptionPlan:     "free",
        subscriptionStatus:   "canceled",
        subscriptionCanceledAt: new Date(),
      }).where(eq(users.id, user.id));
      break;

    case "invoice.payment_failed":
      // Mark as past_due so the renewal page is shown
      await db.update(users).set({
        subscriptionStatus: "past_due",
      }).where(eq(users.id, user.id));
      break;
  }

  res.json({ received: true });
}

app.post("/api/subscription/webhook", handleWebhook);
app.post("/api/stripe/webhook", handleWebhook);

}
