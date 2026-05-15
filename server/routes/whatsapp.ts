import { Express, Request, Response } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { users, plantillasWhatsapp, mensajesComunicacion, certifications } from "../../shared/schema";
import { authenticate } from "../auth";
import { encryptApiKey, validateApiKey, DEFAULT_TEMPLATES, TEMPLATE_LABELS, AVAILABLE_PLACEHOLDERS } from "../whatsapp";
import { sendNotification, retryMensaje } from "../notifications";
import { createNotification } from "../createNotification";

export function registerWhatsAppRoutes(app: Express) {
// ══════════════════════════════════════════════════════════════════════════════
// WHATSAPP BUSINESS — Connection management
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/whatsapp/status — current connection state
app.get("/api/whatsapp/status", authenticate, async (req: any, res) => {
  try {
    const userId = req.user?.id ?? req.userId;
    const [u] = await db.select().from(users).where(eq(users.id, userId));
    const connected = !!(u as any).whatsappApiKey;
    res.json({
      connected,
      phone: (u as any).whatsappPhone ?? null,
      connectedAt: (u as any).whatsappConnectedAt ?? null,
    });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// POST /api/whatsapp/connect — validate and save an API key
app.post("/api/whatsapp/connect", authenticate, async (req: any, res) => {
  const { apiKey, phone } = req.body;
  if (!apiKey) return res.status(400).json({ message: "apiKey requerida" });
  try {
    const check = await validateApiKey(apiKey);
    if (!check.valid) return res.status(400).json({ message: check.error ?? "API key inválida" });

    await db.update(users).set({
      whatsappApiKey: encryptApiKey(apiKey),
      whatsappPhone: phone ?? null,
      whatsappConnectedAt: new Date(),
      updatedAt: new Date(),
    } as any).where(eq(users.id, req.userId));

    res.json({ ok: true, phone: phone ?? null });
  } catch {
    res.status(500).json({ message: "Error al conectar WhatsApp" });
  }
});

// DELETE /api/whatsapp/disconnect — remove WhatsApp credentials
app.delete("/api/whatsapp/disconnect", authenticate, async (req: any, res) => {
  try {
    await db.update(users).set({
      whatsappApiKey: null,
      whatsappPhone: null,
      whatsappConnectedAt: null,
      updatedAt: new Date(),
    } as any).where(eq(users.id, req.userId));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// WHATSAPP BUSINESS — Message templates
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/whatsapp/templates — all 8 templates (custom or default)
app.get("/api/whatsapp/templates", authenticate, async (req: any, res) => {
  try {
    const customs = await db
      .select()
      .from(plantillasWhatsapp)
      .where(eq(plantillasWhatsapp.userId, req.userId));

    const result = Object.entries(TEMPLATE_LABELS).map(([num, label]) => {
      const tipo = parseInt(num);
      const custom = customs.find(c => c.tipoMensaje === tipo);
      return {
        tipo,
        label,
        contenido: custom?.contenido ?? DEFAULT_TEMPLATES[tipo] ?? "",
        isCustom: !!custom,
        placeholders: AVAILABLE_PLACEHOLDERS,
      };
    });
    res.json(result);
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// PUT /api/whatsapp/templates/:tipo — upsert a single template
app.put("/api/whatsapp/templates/:tipo", authenticate, async (req: any, res) => {
  const tipo = parseInt(req.params.tipo);
  const { contenido } = req.body;
  if (!tipo || !contenido) return res.status(400).json({ message: "Datos incompletos" });
  try {
    const [existing] = await db
      .select()
      .from(plantillasWhatsapp)
      .where(and(eq(plantillasWhatsapp.userId, req.userId), eq(plantillasWhatsapp.tipoMensaje, tipo)));

    if (existing) {
      await db.update(plantillasWhatsapp)
        .set({ contenido, updatedAt: new Date() })
        .where(eq(plantillasWhatsapp.id, existing.id));
    } else {
      await db.insert(plantillasWhatsapp).values({
        userId: req.userId,
        tipoMensaje: tipo,
        contenido,
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al guardar plantilla" });
  }
});

// DELETE /api/whatsapp/templates/:tipo — reset to default
app.delete("/api/whatsapp/templates/:tipo", authenticate, async (req: any, res) => {
  const tipo = parseInt(req.params.tipo);
  try {
    await db.delete(plantillasWhatsapp)
      .where(and(eq(plantillasWhatsapp.userId, req.userId), eq(plantillasWhatsapp.tipoMensaje, tipo)));
    res.json({ ok: true, contenido: DEFAULT_TEMPLATES[tipo] });
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// MENSAJES COMUNICACIÓN — History & manual send
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/certifications/:id/mensajes — communication timeline
app.get("/api/certifications/:id/mensajes", authenticate, async (req: any, res) => {
  const certId = parseInt(req.params.id);
  try {
    const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
    if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

    const msgs = await db
      .select()
      .from(mensajesComunicacion)
      .where(eq(mensajesComunicacion.certificationId, certId))
      .orderBy(mensajesComunicacion.fechaEnvio);

    res.json(msgs);
  } catch {
    res.status(500).json({ message: "Error" });
  }
});

// POST /api/certifications/:id/mensajes — send a manual message
app.post("/api/certifications/:id/mensajes", authenticate, async (req: any, res) => {
  const certId = parseInt(req.params.id);
  const { texto, canal } = req.body;
  if (!texto) return res.status(400).json({ message: "Texto requerido" });
  try {
    const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
    if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

    await sendNotification({ certificationId: certId, tipo: "manual", manualText: texto });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al enviar mensaje" });
  }
});

// POST /api/certifications/:id/mensajes/:msgId/retry — retry a failed message
app.post("/api/certifications/:id/mensajes/:msgId/retry", authenticate, async (req: any, res) => {
  const certId = parseInt(req.params.id);
  const msgId  = parseInt(req.params.msgId);
  try {
    const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
    if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

    await retryMensaje(msgId);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al reintentar" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// SENDNOTIFICATION — Trigger endpoints for certifier dashboard actions
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/certifications/:id/notify/:tipo — send a specific notification type
app.post("/api/certifications/:id/notify/:tipo", authenticate, async (req: any, res) => {
  const certId = parseInt(req.params.id);
  const tipo   = req.params.tipo === "manual"
    ? ("manual" as const)
    : parseInt(req.params.tipo) as any;
  const { manualText, documentUrl } = req.body;
  try {
    const [cert] = await db.select().from(certifications).where(eq(certifications.id, certId));
    if (!cert || cert.userId !== req.userId) return res.status(403).json({ message: "No autorizado" });

    await sendNotification({ certificationId: certId, tipo, manualText, documentUrl });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: "Error al enviar notificación" });
  }
});

}
