/**
 * CERTIFIVE — WhatsApp Business module (360dialog)
 *
 * Each certifier links their own 360dialog API key.
 * The key is stored AES-256-CBC encrypted in the DB.
 *
 * Exports:
 *  - encryptApiKey / decryptApiKey   — secure storage helpers
 *  - validateApiKey                   — test key against 360dialog
 *  - sendWhatsAppText                 — send a plain text message
 *  - sendWhatsAppDocument             — send a PDF document
 *  - DEFAULT_TEMPLATES / TEMPLATE_LABELS / AVAILABLE_PLACEHOLDERS
 *  - fillTemplate                     — replace [placeholder] tokens
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { config } from "./config";

// ── AES-256-CBC encryption ────────────────────────────────────────────────────

const RAW_KEY = config.ENCRYPTION_KEY;
const ENC_KEY  = Buffer.from(RAW_KEY.padEnd(32, "0").slice(0, 32));

export function encryptApiKey(plain: string): string {
  const iv      = randomBytes(16);
  const cipher  = createCipheriv("aes-256-cbc", ENC_KEY, iv);
  const enc     = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + enc.toString("hex");
}

export function decryptApiKey(stored: string): string {
  const [ivHex, encHex] = stored.split(":");
  const iv      = Buffer.from(ivHex, "hex");
  const enc     = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", ENC_KEY, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ── 360dialog REST client ─────────────────────────────────────────────────────

const WABA_BASE = "https://waba.360dialog.io/v1";

async function dialogFetch(
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${WABA_BASE}${path}`, {
    ...options,
    headers: {
      "D360-API-KEY": apiKey,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
}

/** Validate an API key with a lightweight call to 360dialog */
export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await dialogFetch(apiKey, "/configs/webhook");
    // 200 = connected, 404 = key valid but webhook not set yet — both are OK
    if (res.status === 200 || res.status === 404) return { valid: true };
    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "API key inválida o sin permisos." };
    }
    return { valid: false, error: `Error del servidor 360dialog: ${res.status}` };
  } catch (err: any) {
    return { valid: false, error: err?.message ?? "No se pudo conectar con 360dialog." };
  }
}

// ── Message senders ───────────────────────────────────────────────────────────

export interface WASendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/** Normalise phone: remove spaces, leading + */
function normPhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^\+/, "");
}

/** Send a plain-text WhatsApp message */
export async function sendWhatsAppText(
  apiKey: string,
  to: string,
  text: string
): Promise<WASendResult> {
  try {
    const res = await dialogFetch(apiKey, "/messages", {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type:    "individual",
        to:                normPhone(to),
        type:              "text",
        text:              { preview_url: false, body: text },
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Error sending WhatsApp text" };
  }
}

/** Send a PDF document via WhatsApp */
export async function sendWhatsAppDocument(
  apiKey: string,
  to: string,
  documentUrl: string,
  filename: string,
  caption?: string
): Promise<WASendResult> {
  try {
    const res = await dialogFetch(apiKey, "/messages", {
      method: "POST",
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type:    "individual",
        to:                normPhone(to),
        type:              "document",
        document: {
          link: documentUrl,
          filename,
          ...(caption ? { caption } : {}),
        },
      }),
    });
    const data = await res.json() as any;
    if (!res.ok) {
      return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Error sending WhatsApp document" };
  }
}

// ── Default message templates ─────────────────────────────────────────────────

export const DEFAULT_TEMPLATES: Record<number, string> = {
  1: "Hola [nombre], soy [nombre_certificador], certificador energético. Para preparar tu presupuesto necesito algunos datos de tu inmueble. Rellena este formulario en 2 minutos: [link_formulario_tasacion]",
  2: "Hola [nombre], ¿pudiste rellenar el formulario de tu inmueble? Lo tienes aquí: [link_formulario_tasacion] — solo tarda 2 minutos.",
  3: "Hola [nombre], aquí tienes el presupuesto para tu certificación energética: [precio]€. Revísalo y acéptalo desde aquí: [link_presupuesto]",
  4: "Hemos recibido tu pago. Ya estamos trabajando en tu certificación energética. En breve te enviamos el formulario para completar los datos del inmueble.",
  5: "Para continuar con tu certificación, necesitamos los datos completos de tu inmueble y algunos documentos (factura de luz, etc.). Rellena aquí: [link_formulario_cee] — Solo lleva unos minutos y puedes hacerlo desde el móvil.",
  6: "Hola [nombre], recuerda completar los datos de tu certificación: [link_formulario_cee] Sin esta información no podemos continuar con el proceso.",
  7: "Tu certificado energético está listo. Para recibirlo, completa el pago final: [link_pago_tramo2]",
  8: "Tu certificado energético está adjunto en este mensaje. Gracias por confiar en [nombre_certificador]. ¡Hasta pronto!",
};

export const TEMPLATE_LABELS: Record<number, string> = {
  1: "Formulario de tasación (inicial)",
  2: "Recordatorio tasación (48 h sin completar)",
  3: "Presupuesto listo",
  4: "Confirmación de pago recibido",
  5: "Formulario CEE (tras pago tramo 1)",
  6: "Recordatorio formulario CEE (72 h sin completar)",
  7: "Certificado listo — solicitud pago tramo 2",
  8: "Entrega del certificado",
};

export const AVAILABLE_PLACEHOLDERS = [
  "[nombre]",
  "[nombre_certificador]",
  "[precio]",
  "[link_formulario_tasacion]",
  "[link_presupuesto]",
  "[link_formulario_cee]",
  "[link_pago_tramo2]",
];

/** Replace [placeholder] tokens with real values */
export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\[([a-z_]+)\]/g, (_, key) => vars[key] ?? `[${key}]`);
}
