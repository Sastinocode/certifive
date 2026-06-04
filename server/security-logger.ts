/**
 * CERTIFIVE — Security Logger
 * Emite eventos de seguridad como logs estructurados usando Pino.
 */
import { logger } from "./logger";

const securityLogger = logger.child({ module: "security" });

export function securityLog(event: string, details: Record<string, string>): void {
  securityLogger.warn({ event, ...details }, `[SECURITY] ${event}`);
}
