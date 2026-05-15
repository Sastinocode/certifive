// @ts-nocheck
import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { pricingRates, insertPricingRateSchema } from "../../shared/schema";
import { authenticate } from "../auth";

export function calcularPrecio(
  basePrice: number, totalArea: number | null, province: string | null,
  areaTiers: any, provinceSurcharges: any,
): { base: number; surchargeArea: number; surchargeProvince: number; total: number } {
  let multiplier = 1;
  if (areaTiers && Array.isArray(areaTiers) && totalArea) {
    for (const tier of areaTiers) {
      if (tier.maxArea === null || totalArea <= tier.maxArea) { multiplier = tier.multiplier ?? 1; break; }
    }
  }
  const base = parseFloat((basePrice * multiplier).toFixed(2));
  let surchargeProvince = 0;
  if (provinceSurcharges && province) {
    const key = province.toLowerCase().replace(/\s+/g, "_");
    const pct = (provinceSurcharges as Record<string, number>)[key] ?? 0;
    surchargeProvince = parseFloat(((base * pct) / 100).toFixed(2));
  }
  const total = parseFloat((base + surchargeProvince).toFixed(2));
  return { base, surchargeArea: base - basePrice, surchargeProvince, total };
}

export function registerPricingRoutes(app: Express) {
// --- PRICING ---

const getPricingRates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const result = await db.select().from(pricingRates).where(eq(pricingRates.userId, userId));
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error al obtener tarifas" });
  }
};

const createPricingRate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [rate] = await db.insert(pricingRates).values({ ...req.body, userId }).returning();
    res.status(201).json(rate);
  } catch {
    res.status(500).json({ message: "Error al crear tarifa" });
  }
};

const updatePricingRate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [rate] = await db.update(pricingRates)
      .set(req.body)
      .where(and(eq(pricingRates.id, parseInt(req.params.id)), eq(pricingRates.userId, userId)))
      .returning();
    res.json(rate);
  } catch {
    res.status(500).json({ message: "Error al actualizar tarifa" });
  }
};

const deletePricingRate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await db.delete(pricingRates).where(and(eq(pricingRates.id, parseInt(req.params.id)), eq(pricingRates.userId, userId)));
    res.json({ message: "Eliminada" });
  } catch {
    res.status(500).json({ message: "Error al eliminar tarifa" });
  }
};

// Primary routes
app.get("/api/pricing", authenticate, getPricingRates);
app.post("/api/pricing", authenticate, createPricingRate);
app.put("/api/pricing/:id", authenticate, updatePricingRate);
app.delete("/api/pricing/:id", authenticate, deletePricingRate);

// Alias routes used by the frontend pricing page
app.get("/api/pricing-rates", authenticate, getPricingRates);
app.post("/api/pricing-rates", authenticate, createPricingRate);
app.patch("/api/pricing-rates/:id", authenticate, updatePricingRate);
app.delete("/api/pricing-rates/:id", authenticate, deletePricingRate);

// ─────────────────────────────────────────────────────────────────────────
// PRICING CALCULATE  POST /api/pricing/calculate
// ─────────────────────────────────────────────────────────────────────────

app.post("/api/pricing/calculate", async (req: Request, res: Response) => {
  try {
    const { certifierId, propertyType, totalArea, province } = req.body;
    if (!certifierId || !propertyType) {
      return res.status(400).json({ message: "certifierId y propertyType son obligatorios" });
    }

    const [rate] = await db.select().from(pricingRates)
      .where(and(
        eq(pricingRates.userId, parseInt(certifierId)),
        eq(pricingRates.propertyType, propertyType),
        eq(pricingRates.isActive, true),
      ))
      .limit(1);

    if (!rate) {
      return res.json({ available: false, message: "No hay tarifa configurada para este tipo de inmueble" });
    }

    const pricing = calcularPrecio(
      parseFloat(rate.basePrice as any),
      totalArea ? parseFloat(totalArea) : null,
      province ?? null,
      rate.areaTiers,
      rate.provinceSurcharges,
    );

    res.json({ available: true, ...pricing });
  } catch {
    res.status(500).json({ message: "Error al calcular precio" });
  }
});

}
