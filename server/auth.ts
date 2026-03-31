import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "certifive-dev-secret-2024";

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}

export async function createDemoUser(): Promise<AuthUser> {
  const existing = await db.select().from(users).where(eq(users.username, "demo")).limit(1);
  if (existing.length > 0) {
    const u = existing[0];
    return { id: u.id, username: u.username, email: u.email, role: u.role, name: u.name, firstName: u.firstName, lastName: u.lastName };
  }
  const [created] = await db.insert(users).values({
    username: "demo",
    email: "demo@certifive.es",
    name: "Demo User",
    firstName: "Demo",
    lastName: "User",
    role: "user",
  }).returning();
  return { id: created.id, username: created.username, email: created.email, role: created.role, name: created.name, firstName: created.firstName, lastName: created.lastName };
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.cookies?.token;

  if (token) {
    if (token === "demo-token") {
      try {
        const demo = await createDemoUser();
        (req as any).user = demo;
        return next();
      } catch {
        return res.status(401).json({ message: "Authentication failed" });
      }
    }
    const user = verifyToken(token);
    if (user) {
      (req as any).user = user;
      return next();
    }
  }

  if ((req as any).session?.user) {
    (req as any).user = (req as any).session.user;
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}
