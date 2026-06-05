/**
 * CERTIFIVE — Configuración centralizada de secretos
 *
 * En DESARROLLO: usa fallbacks y agrupa los avisos en consola al arrancar.
 * En PRODUCCIÓN:  lanza un error al arrancar si falta cualquier variable crítica.
 *
 * Añade en Railway (Variables del servicio certifive):
 *   JWT_SECRET      — 64 bytes hex aleatorio
 *   SESSION_SECRET  — 64 bytes hex aleatorio
 *   ENCRYPTION_KEY  — exactamente 32 caracteres (AES-256)
 */

const isProd = process.env.NODE_ENV === "production";

// ANSI — solo en entornos con TTY; en Railway/CI los logs no tienen colores
const _Y  = "\x1b[33m";  // amarillo
const _B  = "\x1b[1m";   // negrita
const _R  = "\x1b[0m";   // reset

// Cola de avisos recopilados durante la carga del módulo
const _pendingWarnings: string[] = [];

// ── Funciones de configuración ────────────────────────────────────────────────

/** Variable CRÍTICA: en producción lanza Error; en desarrollo usa fallback y encola aviso. */
function requireSecret(name: string, devFallback: string): string {
  const val = process.env[name];
  if (!val) {
    if (isProd) {
      throw new Error(
        `[CONFIG] ❌ Variable de entorno requerida no configurada: ${name}.\n` +
        `         Añádela en Railway → servicio certifive → Variables.`
      );
    }
    _pendingWarnings.push(
      `  ${_Y}⚠️  [CONFIG] ${name} usando valor por defecto. ` +
      `Añade ${name} a tu .env${_R}`
    );
    return devFallback;
  }
  return val;
}

/**
 * Variable OPCIONAL con fallback razonable en desarrollo (p.ej. claves de
 * servicios externos: SENDGRID_API_KEY, URLs de webhooks, etc.).
 * Nunca lanza Error, pero sí encola un aviso si el valor no está definido.
 */
export function warnIfDefault(name: string, devFallback: string): string {
  const val = process.env[name];
  if (!val) {
    _pendingWarnings.push(
      `  ${_Y}⚠️  [CONFIG] ${name} no configurada. ` +
      `Añade ${name} a tu .env para habilitar esta funcionalidad${_R}`
    );
    return devFallback;
  }
  return val;
}

/**
 * Imprime en consola todos los avisos de configuración agrupados.
 * Llamar UNA SOLA VEZ, antes de app.listen(), para que los warnings aparezcan
 * antes del mensaje "Server running on port X".
 * En producción es un no-op (los errores habrán lanzado antes de llegar aquí).
 */
export function printConfigWarnings(): void {
  if (isProd || _pendingWarnings.length === 0) return;

  const line  = `${_Y}${_B}${"═".repeat(60)}${_R}`;
  const title = `${_Y}${_B}  ⚠️  CERTIFIVE — Variables de entorno sin configurar${_R}`;

  console.warn(`\n${line}`);
  console.warn(title);
  console.warn(line);
  for (const w of _pendingWarnings) {
    console.warn(w);
  }
  console.warn(
    `\n  ${_Y}→  Copia .env.example a .env y rellena los valores reales.${_R}`
  );
  console.warn(`${line}\n`);
}

// ── Objeto de configuración ───────────────────────────────────────────────────

export const config = {
  JWT_SECRET:      requireSecret("JWT_SECRET",      "certifive-dev-secret-2024"),
  SESSION_SECRET:  requireSecret("SESSION_SECRET",  "certifive-session-secret-2024"),
  ENCRYPTION_KEY:  requireSecret("ENCRYPTION_KEY",  "certifive-default-key-change-me!!"),
  SENTRY_DSN:      warnIfDefault("SENTRY_DSN",      ""),
  // Cuenta compartida de Certifive (360dialog).
  // Fallback cuando el certificador no tiene su propio WABA.
  // Si no está configurada, el sistema cae a email como siempre.
  PLATFORM_WA_API_KEY: warnIfDefault("PLATFORM_WA_API_KEY", ""),
  PLATFORM_WA_PHONE:   warnIfDefault("PLATFORM_WA_PHONE",   ""),
} as const;
