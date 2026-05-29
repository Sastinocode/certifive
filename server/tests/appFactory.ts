/**
 * Crea una instancia Express con todas las rutas registradas,
 * pero usando MemoryStore en lugar de connect-pg-simple.
 * Solo para tests — no importar desde código de producción.
 */
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "../routes/index";

const MStore = MemoryStore(session);

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      store: new MStore({ checkPeriod: 86_400_000 }),
      secret: process.env.SESSION_SECRET ?? "test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  registerRoutes(app);
  return app;
}
