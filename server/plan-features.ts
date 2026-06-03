import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";

export type Feature = "whatsapp" | "reports" | "invoicing" | "multi_user";

// Which features each plan unlocks.
// Aliases (pro, enterprise) mirror their canonical names so webhook-assigned
// plans and legacy env-var names both resolve correctly.
export const PLAN_FEATURES: Record<string, Feature[]> = {
  free:        [],
  basico:      [],
  pay_per_use: [],
  profesional: ["whatsapp", "reports", "invoicing"],
  pro:         ["whatsapp", "reports", "invoicing"],
  empresa:     ["whatsapp", "reports", "invoicing", "multi_user"],
  enterprise:  ["whatsapp", "reports", "invoicing", "multi_user"],
};

export function getPlanFeatures(plan: string | null | undefined): Feature[] {
  return PLAN_FEATURES[(plan ?? "free").toLowerCase()] ?? [];
}

/**
 * Express middleware factory.
 * Reads subscriptionPlan from DB (req.user must already be set by authenticate)
 * and returns 403 FEATURE_NOT_IN_PLAN when the user's plan doesn't include
 * the requested feature.
 */
export function requireFeature(feature: Feature) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    try {
      const [row] = await db
        .select({ subscriptionPlan: users.subscriptionPlan })
        .from(users)
        .where(eq(users.id, req.user.id))
        .limit(1);

      const plan = row?.subscriptionPlan ?? "free";

      if (getPlanFeatures(plan).includes(feature)) {
        return next();
      }

      res.status(403).json({
        code: "FEATURE_NOT_IN_PLAN",
        upgradeRequired: true,
        feature,
        currentPlan: plan,
      });
    } catch {
      next();
    }
  };
}
