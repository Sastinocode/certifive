/**
 * CERTIFIVE — Logger central (Pino)
 *
 * - Desarrollo : pretty-print legible en consola
 * - Producción : JSON estructurado (Railway lo indexa automáticamente)
 *
 * Uso:
 *   import { logger } from "./logger";
 *   logger.info("Servidor arrancado");
 *   logger.error({ err, userId }, "Error al procesar pago");
 */
import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),

  // En producción emitimos JSON puro; en desarrollo, formato legible.
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino/file",   // stdout sin pretty para no añadir dep extra
          options: { destination: 1 },
        },
      }),

  // Campos base presentes en todos los logs
  base: {
    app: "certifive",
    env: process.env.NODE_ENV ?? "development",
  },

  // Serializa los objetos Error correctamente
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },

  // ISO timestamp legible
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
