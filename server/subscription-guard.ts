import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "../shared/schema";
import { authenticate } from "./auth";

// Paths (relative to /api) that bypass the subscription wall.
// Webhooks, public forms, auth and pricing must always be accessible.
const EXEMPT: Array<string | RegExp> = [
  /^\/auth(\/|$)/,
  /^\/solicitudes(\/|$)/,
  /^\/waitlist$/,
  /^\/beta-leads$/,
  /^\/c\//,
  /^\/pricing(\/|$)/,
  /^\/health$/,
  /^\/subscription\/webhook$/,
  /^\/stripe\/webhook$/,
];

function isExempt(path: string): boolean {
  return EXEMPT.some((p) =>
    typeof p === "string" ? path === p || path.startsWith(p) : p.test(path)
  );
}

async function enforceSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    // authenticate did not populate req.user — it already sent a 401
    return;
  }

  if (process.env.NODE_ENV === "test" || req.user?.role === "admin") {
    return next();
  }

  try {
    const [row] = await db
      .select({ subscriptionStatus: users.subscriptionStatus })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    const status = row?.subscriptionStatus;

    if (status === "active" || status === "trialing") {
      return next();
    }

    res.status(403).json({
      message: "Suscripción requerida",
      code: "SUBSCRIPTION_REQUIRED",
    });
  } catch {
    // On DB error, don't block the request
    next();
  }
}

/**
 * Global middleware for Express — mount on /api.
 * Exempt paths pass straight through.
 * All other paths: authenticate first, then verify the subscription is
 * active or trialing.
 */
export function checkSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (isExempt(req.path)) return next();

  // Authenticate first (sets req.user), then enforce subscription.
  // If authenticate fails it sends 401 and does NOT call next, so
  // enforceSubscription is only reached for valid sessions.
  authenticate(req, res, () => enforceSubscription(req, res, next));
}
