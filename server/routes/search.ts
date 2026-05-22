import { Express, Request, Response } from "express";
import { db } from "../db";
import { ilike, or, and, eq, desc, sql } from "drizzle-orm";
import { certifications, folders } from "../../shared/schema";
import { authenticate } from "../auth";

// ── Páginas de navegación rápida ─────────────────────────────────────────────
const NAV_PAGES = [
  { id: "dashboard",     label: "Dashboard",       description: "Resumen y KPIs",                path: "/",                icon: "LayoutDashboard" },
  { id: "certificados",  label: "Expedientes",      description: "Gestión de certificaciones",    path: "/certificados",    icon: "FileText" },
  { id: "propiedades",   label: "Clientes",         description: "Carpetas y propiedades",        path: "/propiedades",     icon: "Users" },
  { id: "informes",      label: "Informes",         description: "Facturación e informes",        path: "/informes",        icon: "BarChart2" },
  { id: "tarifas",       label: "Facturación",      description: "Tarifas y facturas",            path: "/tarifas",         icon: "Receipt" },
  { id: "whatsapp",      label: "WhatsApp",         description: "Mensajes y conversaciones",     path: "/whatsapp",        icon: "MessageCircle" },
  { id: "configuracion", label: "Configuración",    description: "Cuenta, notificaciones, accesos", path: "/configuracion", icon: "Settings" },
  { id: "formulario",    label: "Formulario CEE",   description: "Cuestionario energético público", path: "/formulario-cee", icon: "ClipboardList" },
];

export function registerSearchRoutes(app: Express) {

  app.get("/api/search", authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const query  = ((req.query.q as string) || "").trim();
      const limit  = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 8));

      // ── Sin query: devolver las últimas certifications accedidas ─────────────
      if (!query) {
        const recent = await db
          .select({
            id:           certifications.id,
            ownerName:    certifications.ownerName,
            address:      certifications.address,
            city:         certifications.city,
            status:       certifications.status,
            energyRating: certifications.energyRating,
            cadastralRef: certifications.cadastralReference,
          })
          .from(certifications)
          .where(and(
            eq(certifications.userId, userId),
            eq(certifications.isArchived, false),
          ))
          .orderBy(desc(certifications.id))
          .limit(5);

        return res.json({
          query: "",
          certifications: recent.map(c => ({
            ...c,
            label:       c.ownerName || c.address || `Expediente #${c.id}`,
            sublabel:    [c.address, c.city].filter(Boolean).join(", "),
            path:        `/certificados`,
            type:        "certification" as const,
          })),
          folders:   [],
          pages:     NAV_PAGES.slice(0, 5),
        });
      }

      const q = `%${query}%`;

      // ── Búsqueda en certifications ───────────────────────────────────────────
      const certResults = await db
        .select({
          id:           certifications.id,
          ownerName:    certifications.ownerName,
          ownerEmail:   certifications.ownerEmail,
          ownerDni:     certifications.ownerDni,
          address:      certifications.address,
          city:         certifications.city,
          postalCode:   certifications.postalCode,
          status:       certifications.status,
          energyRating: certifications.energyRating,
          cadastralRef: certifications.cadastralReference,
        })
        .from(certifications)
        .where(and(
          eq(certifications.userId, userId),
          eq(certifications.isArchived, false),
          or(
            ilike(certifications.ownerName,          q),
            ilike(certifications.ownerEmail,         q),
            ilike(certifications.ownerDni,           q),
            ilike(certifications.address,            q),
            ilike(certifications.city,               q),
            ilike(certifications.postalCode,         q),
            ilike(certifications.cadastralReference, q),
          ),
        ))
        .orderBy(desc(certifications.id))
        .limit(limit);

      // ── Búsqueda en folders ──────────────────────────────────────────────────
      const folderResults = await db
        .select({
          id:              folders.id,
          name:            folders.name,
          clientName:      folders.clientName,
          cadastralRef:    folders.cadastralReference,
        })
        .from(folders)
        .where(and(
          eq(folders.userId, userId),
          or(
            ilike(folders.name,              q),
            ilike(folders.clientName,        q),
            ilike(folders.cadastralReference, q),
          ),
        ))
        .limit(Math.ceil(limit / 2));

      // ── Filtrar páginas de navegación ────────────────────────────────────────
      const ql = query.toLowerCase();
      const pageResults = NAV_PAGES.filter(p =>
        p.label.toLowerCase().includes(ql) ||
        p.description.toLowerCase().includes(ql)
      ).slice(0, 3);

      return res.json({
        query,
        certifications: certResults.map(c => ({
          ...c,
          label:    c.ownerName || c.address || `Expediente #${c.id}`,
          sublabel: [c.address, c.city].filter(Boolean).join(", "),
          path:     `/certificados`,
          type:     "certification" as const,
        })),
        folders: folderResults.map(f => ({
          ...f,
          label:    f.name || f.clientName || `Carpeta #${f.id}`,
          sublabel: f.clientName || f.cadastralRef || "",
          path:     `/propiedades`,
          type:     "folder" as const,
        })),
        pages: pageResults,
      });

    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Error en la búsqueda" });
    }
  });
}
