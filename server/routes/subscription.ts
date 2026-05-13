import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { users } from "../../shared/schema";
import { authenticate } from "../auth";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  basico:     process.env.STRIPE_PRICE_BASICO,
  pro:        process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

export function registerSubscriptionRoutes(app: Express) {
// ══════════════════════════════════════════════════════════════════════════════

const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  basico:     process.env.STRIPE_PRICE_BASICO,
  pro:        process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

// GET /api/subscription — current plan info
app.get("/api/subscription", authenticate, async (req: Request, res: Response) => {
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
        // Stripe call failed — use DB data
      }
    }

    res.json({
      plan: user.subscriptionPlan ?? "free",
      status: stripeData?.status ?? user.subscriptionStatus ?? "active",
      currentPeriodEnd: stripeData?.currentPeriodEnd ?? (user.subscriptionCurrentPeriodEnd ? user.subscriptionCurrentPeriodEnd.toISOString() : null),
      cancelAtPeriodEnd: stripeData?.cancelAtPeriodEnd ?? false,
      cancelAt: stripeData?.cancelAt ?? null,
      stripeCustomerId: user.stripeCustomerId,
      stripeConfigured: !!stripe,
      priceIds: PLAN_PRICE_IDS,
    });
  } catch {
    res.status(500).json({ message: "Error al obtener suscripción" });
  }
});

// POST /api/subscription/portal — create Stripe Customer Portal session
app.post("/api/subscription/portal", authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado. Añade STRIPE_SECRET_KEY." });
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Create Stripe customer if doesn't exist
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
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[subscription/portal]", err.message);
    res.status(500).json({ message: err.message ?? "Error al abrir el portal de suscripción" });
  }
});

// POST /api/subscription/checkout — new subscription checkout
app.post("/api/subscription/checkout", authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(503).json({ message: "Stripe no configurado." });
    const { plan, returnUrl } = req.body;
    const priceId = PLAN_PRICE_IDS[plan];
    if (!priceId) return res.status(400).json({ message: `Plan '${plan}' no configurado. Añade STRIPE_PRICE_${plan.toUpperCase()} en las variables de entorno.` });

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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl ?? `${origin}/configuracion`}?subscription=success`,
      cancel_url:  `${returnUrl ?? `${origin}/configuracion`}?subscription=canceled`,
      metadata: { userId: String(userId), plan },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[subscription/checkout]", err.message);
    res.status(500).json({ message: err.message ?? "Error al iniciar el checkout" });
  }
});

// GET /api/subscription/invoices — list Stripe invoices
app.get("/api/subscription/invoices", authenticate, async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.json({ invoices: [], stripeConfigured: false });
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user?.stripeCustomerId) return res.json({ invoices: [], stripeConfigured: true });

    const list = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 24,
    });

    const invoices = list.data.map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      status: inv.status,
      created: new Date(inv.created * 1000).toISOString(),
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url,
      description: inv.description ?? inv.lines?.data?.[0]?.description ?? null,
    }));

    res.json({ invoices, stripeConfigured: true });
  } catch (err: any) {
    console.error("[subscription/invoices]", err.message);
    res.status(500).json({ message: "Error al cargar facturas de Stripe" });
  }
});

// POST /api/subscription/webhook — handle subscription lifecycle events
// (re-uses the existing /api/stripe/webhook for payment_intent events,
//  this handles subscription-specific events)
app.post("/api/subscription/webhook", async (req: Request, res: Response) => {
  if (!stripe) return res.status(503).json({ message: "Stripe no configurado" });
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;
  try {
    const raw = (req as any).rawBody ?? JSON.stringify(req.body);
    event = secret ? stripe.webhooks.constructEvent(raw, sig, secret) : JSON.parse(raw);
  } catch {
    return res.status(400).json({ message: "Webhook signature inválida" });
  }

  const sub = event.data?.object;
  if (!sub?.customer) return res.json({ received: true });

  const [user] = await db.select({ id: users.id })
    .from(users).where(eq(users.stripeCustomerId, sub.customer)).limit(1);
  if (!user) return res.json({ received: true });

  const planByPrice = Object.entries(PLAN_PRICE_IDS).find(([, pid]) => pid === sub.items?.data?.[0]?.price?.id)?.[0] ?? null;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await db.update(users).set({
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items?.data?.[0]?.price?.id ?? null,
        subscriptionPlan: planByPrice ?? "pro",
        subscriptionStatus: sub.status,
        subscriptionCurrentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        subscriptionCanceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      }).where(eq(users.id, user.id));
      break;
    case "customer.subscription.deleted":
      await db.update(users).set({
        stripeSubscriptionId: null,
        subscriptionPlan: "free",
        subscriptionStatus: "canceled",
        subscriptionCanceledAt: new Date(),
      }).where(eq(users.id, user.id));
      break;
  }
  res.json({ received: true });
});

}
