/**
 * Augmentación del tipo Request de Express.
 *
 * El middleware `authenticate` (server/auth.ts) añade `user` y `userId`
 * al objeto request después de verificar el JWT. Este fichero declara esas
 * propiedades para que TypeScript las reconozca en todos los route handlers,
 * eliminando la necesidad de `(req as any).user` en cada fichero.
 */
import type { AuthUser } from "../auth";

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado, disponible tras pasar por el middleware `authenticate`. */
      user?: AuthUser;
      /** Shorthand: user.id. Añadido por compatibilidad con handlers legacy. */
      userId?: number;
    }
  }
}

// Necesario para que TypeScript trate este fichero como un módulo
export {};
