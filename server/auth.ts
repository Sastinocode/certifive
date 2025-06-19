import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Token de acceso requerido" });
  }

  // Handle demo tokens
  if (token.startsWith("demo-token-")) {
    const demoUser = {
      id: "demo-user",
      email: "demo@certificacion.com",
      firstName: "Usuario",
      lastName: "Demo",
      company: "Empresa Demo",
      role: "demo",
      dni: "",
      phone: "",
      address: "",
      license: "",
      isVerified: true
    };
    
    req.userId = "demo-user";
    req.user = demoUser;
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }

  try {
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    req.userId = payload.userId;
    req.user = user;
    next();
  } catch (error) {
    console.error("Error en autenticación:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function requireVerification(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isVerified) {
    return res.status(403).json({ 
      message: "Cuenta no verificada. Por favor verifica tu email." 
    });
  }
  next();
}

export async function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "No tienes permisos para acceder a este recurso" 
      });
    }
    next();
  };
}