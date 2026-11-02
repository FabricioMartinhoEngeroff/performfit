import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: { __DEV_ADMIN__: "null" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/data/**/*.ts",
        "src/utils/**/*.ts",
        "src/components/**/*.tsx",
        "src/hooks/**/*.ts",
        "src/components/login/**/*.{ts,tsx}",
      ],
      exclude: ["src/__tests__/**", "src/main.tsx", "src/styles/**"],
      // Mínimo de 90% (linhas e branches) nas pastas de auth.
      thresholds: {
        "src/components/login/**": { lines: 90, branches: 90 },
      },
    },
  },
});
