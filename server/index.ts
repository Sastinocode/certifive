import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes/index";
import { initEmail } from "./email";
import { startReminderCron } from "./notifications";
import { startDigestCron } from "./digest";
import catastroRouter from "./routes/catastro";
import { config } from "./config";

const PgStore = connectPg(session);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Railway (y cualquier cloud) usa reverse proxies — necesario para rate-limit e IPs reales
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "blob:", "https:"],
      connectSrc:  ["'self'", "https://api.stripe.com", "ws:", "wss:"],
      frameSrc:    ["https://js.stripe.com"],
      objectSrc:   ["'none'"],
    },
  },
  frameguard:     { action: "deny" },
  noSniff:        true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "session",
    createTableIfMissing: true,
  }),
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Initialize email service (no-op if SENDGRID_API_KEY is not set)
initEmail();

// Start hourly reminder cron jobs (48h solicitud, 72h CEE form)
startReminderCron();

// Start daily digest cron (08:00 Europe/Madrid)
startDigestCron();

// Catastro proxy (avoids CORS — browser can't call ovc.catastro.meh.es directly)
app.use("/api/catastro", catastroRouter);

registerRoutes(app);

const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
      hmr: { port: 24678 },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "public");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = parseInt(process.env.PORT || "5000");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`CERTIFIVE server running on port ${PORT}`);
});

export default app;
