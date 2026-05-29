import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    isolate: true,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    include: ["server/tests/**/*.test.ts"],
    setupFiles: ["server/tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@": path.resolve(__dirname, "client/src"),
    },
  },
});
