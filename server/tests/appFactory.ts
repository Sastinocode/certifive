/**
 * Crea una instancia Express con todas las rutas registradas.
 * Solo para tests — no importar desde código de producción.
 */
import express from "express";
import { registerRoutes } from "../routes/index";

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  registerRoutes(app);
  return app;
}
