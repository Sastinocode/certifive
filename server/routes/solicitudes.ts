// @ts-nocheck
import { Express, Request, Response } from "express";
import Stripe from "stripe";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { solicitudes } from "../../shared/schema";

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? "unknown",
  message: { message: "Demasiados intentos. Espera 15 minutos." },
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

function generarNumeroPedido(): string {
  const year = new Date().getFullYear();
  const num  = Math.floor(Math.random() * 90000 + 10000);
  return `CTF-${year}-${num}`;
}

export function registerSolicitudesRoutes(app: Express) {

  // ── POST /api/solicitudes/checkout ──────────────────────────────────────────
  // Público. Crea un PaymentIntent (tarjeta) o devuelve numeroPedido (otros métodos).
  app.post("/api/solicitudes/checkout", checkoutLimiter, async (req: Request, res: Response) => {
    try {
      const {
        metodoPago, importeTotal,
        nombre, email, telefono,
        tipoInmueble, ciudad, superficie, finalidad,
      } = req.body;

      if (!metodoPago || importeTotal == null) {
        return res.status(400).json({ message: "metodoPago e importeTotal son obligatorios" });
      }

      const importeCentimos = Math.round(parseFloat(importeTotal) * 100);
      if (isNaN(importeCentimos) || importeCentimos < 50) {
        return res.status(400).json({ message: "Importe inválido" });
      }

      const numeroPedido = generarNumeroPedido();

      const baseValues = {
        nombre:       nombre ?? null,
        email:        email ?? null,
        telefono:     telefono ?? null,
        tipoInmueble: tipoInmueble ?? null,
        ciudad:       ciudad ?? null,
        superficie:   superficie != null ? String(superficie) : null,
        finalidad:    finalidad ?? null,
        numeroPedido,
        metodoPago:   metodoPago ?? null,
        importeTotal: importeTotal != null ? String(importeTotal) : null,
        estado:       "lead" as const,
        updatedAt:    new Date(),
      };

      // Upsert por numeroPedido (reintento del usuario sin recargar página)
      await db.insert(solicitudes)
        .values(baseValues)
        .onConflictDoUpdate({
          target: solicitudes.numeroPedido,
          set: { ...baseValues, numeroPedido: undefined },
        });

      if (metodoPago === "tarjeta") {
        if (!stripe) {
          return res.status(503).json({ message: "Pagos con tarjeta no disponibles temporalmente" });
        }

        const intent = await stripe.paymentIntents.create({
          amount:   importeCentimos,
          currency: "eur",
          metadata: { numeroPedido, origen: "solicitud_cee_publico" },
          automatic_payment_methods: { enabled: true },
        });

        // Guardar el PaymentIntent para poder verificarlo en /confirm
        await db.update(solicitudes)
          .set({ stripePaymentIntentId: intent.id, updatedAt: new Date() })
          .where(eq(solicitudes.numeroPedido, numeroPedido));

        return res.json({ numeroPedido, clientSecret: intent.client_secret });
      }

      // transferencia / bizum / paypal — marcar como presupuesto (pendiente confirmación manual)
      await db.update(solicitudes)
        .set({ estado: "presupuesto", updatedAt: new Date() })
        .where(eq(solicitudes.numeroPedido, numeroPedido));

      return res.json({ numeroPedido, pendiente: true });
    } catch (err: any) {
      console.error("[solicitudes/checkout]", err?.message);
      res.status(500).json({ message: "Error al procesar el pedido" });
    }
  });

  // ── POST /api/solicitudes/checkout/confirm ──────────────────────────────────
  // Llamado desde el cliente tras confirmar el PaymentIntent con Stripe.js.
  app.post("/api/solicitudes/checkout/confirm", async (req: Request, res: Response) => {
    const { numeroPedido } = req.body;
    if (!numeroPedido) {
      return res.status(400).json({ message: "numeroPedido es obligatorio" });
    }

    try {
      await db.update(solicitudes)
        .set({ estado: "presupuesto", updatedAt: new Date() })
        .where(eq(solicitudes.numeroPedido, numeroPedido));

      res.json({ ok: true });
    } catch (err: any) {
      console.error("[solicitudes/confirm]", err?.message);
      res.status(500).json({ message: "Error al confirmar el pedido" });
    }
  });

  // ── GET /api/solicitudes/seguimiento/:numeroPedido ──────────────────────────
  // Público. Devuelve estado e info básica de un pedido para la página de seguimiento.
  app.get("/api/solicitudes/seguimiento/:token", async (req: Request, res: Response) => {
    const { token } = req.params;

    try {
      const [row] = await db.select({
        numeroPedido:  solicitudes.numeroPedido,
        estado:        solicitudes.estado,
        nombre:        solicitudes.nombre,
        email:         solicitudes.email,
        tipoInmueble:  solicitudes.tipoInmueble,
        ciudad:        solicitudes.ciudad,
        metodoPago:    solicitudes.metodoPago,
        importeTotal:  solicitudes.importeTotal,
        createdAt:     solicitudes.createdAt,
        updatedAt:     solicitudes.updatedAt,
      })
      .from(solicitudes)
      .where(eq(solicitudes.numeroPedido, token))
      .limit(1);

      if (!row) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json(row);
    } catch (err: any) {
      console.error("[solicitudes/seguimiento]", err?.message);
      res.status(500).json({ message: "Error al consultar el pedido" });
    }
  });
}
