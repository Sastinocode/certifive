import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

// ── Sentry (monitorización de errores) ────────────────────────────────────────
// Solo se activa si VITE_SENTRY_DSN está configurado; sin DSN es un no-op.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// ── Service Worker registration ───────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] registered:", reg.scope);
        // Check for updates every time the app loads
        reg.update();
      })
      .catch((err) => console.warn("[SW] registration failed:", err));
  });
}
