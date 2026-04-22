import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { initEmail } from "./email";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "certifive-session-secret-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Initialize email service (no-op if SENDGRID_API_KEY is not set)
initEmail();

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
