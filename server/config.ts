/**
 * CERTIFIVE — Configuración centralizada de secretos
 *
 * En DESARROLLO: usa fallbacks con un aviso en consola.
 * En PRODUCCIÓN:  lanza un error al arrancar si falta cualquier variable.
 *
 * Añade en Railway (Variables del servicio certifive):
 *   JWT_SECRET      — 64 bytes hex aleatorio
 *   SESSION_SECRET  — 64 bytes hex aleatorio
 *   ENCRYPTION_KEY  — exactamente 32 caracteres (AES-256)
 */

const isProd = process.env.NODE_ENV === "production";

function requireSecret(name: string, devFallback: string): string {
  const val = process.env[name];
  if (!val) {
    if (isProd) {
      throw new Error(
        `[CONFIG] ❌ Variable de entorno requerida no configurada: ${name}.\n` +
        `         Añádela en Railway → servicio certifive → Variables.`
      );
    }
    console.warn(
      `[CONFIG] ⚠️  ${name} no está definida. ` +
      `Usando fallback de desarrollo — NUNCA uses esto en producción.`
    );
    return devFallback;
  }
  return val;
}

export const config = {
  JWT_SECRET:      requireSecret("JWT_SECRET",      "certifive-dev-secret-2024"),
  SESSION_SECRET:  requireSecret("SESSION_SECRET",  "certifive-session-secret-2024"),
  ENCRYPTION_KEY:  requireSecret("ENCRYPTION_KEY",  "certifive-default-key-change-me!!"),
} as const;
