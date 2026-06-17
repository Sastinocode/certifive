import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

/**
 * Stamp the Service Worker's CACHE_NAME with a per-build id so every deploy
 * invalidates the previous cache. Uses $BUILD_ID when provided (CI), otherwise
 * a hash derived from the emitted bundle filenames (which embed content hashes),
 * so the id only changes when the bundle actually changes.
 */
function swCacheVersion(): Plugin {
  let buildId = "";
  return {
    name: "sw-cache-version",
    apply: "build",
    generateBundle(_options, bundle) {
      buildId =
        process.env.BUILD_ID ||
        crypto
          .createHash("sha256")
          .update(Object.keys(bundle).sort().join("|"))
          .digest("hex")
          .slice(0, 12);
    },
    closeBundle() {
      const swPath = path.resolve(import.meta.dirname, "dist/public/sw.js");
      if (!fs.existsSync(swPath)) return;
      const id = buildId || Date.now().toString(36);
      const src = fs.readFileSync(swPath, "utf8");
      fs.writeFileSync(swPath, src.replace(/__BUILD_ID__/g, id));
      console.log(`[sw-cache-version] CACHE_NAME → certifive-${id}`);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    swCacheVersion(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
