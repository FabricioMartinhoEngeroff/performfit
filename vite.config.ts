import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import * as fs from "fs";

const httpsConfig =
  fs.existsSync("./server.key") && fs.existsSync("./server.crt")
    ? { key: fs.readFileSync("./server.key"), cert: fs.readFileSync("./server.crt") }
    : undefined;

export default defineConfig(({ command, mode }) => {
  // Admin fixo de DEV: lido do .env.local (sem prefixo VITE_, então não vai para import.meta.env)
  // e injetado só no `vite dev`. No build de produção vira null.
  const env = loadEnv(mode, process.cwd(), "DEV_ADMIN_");
  const devAdmin =
    command === "serve" && env.DEV_ADMIN_EMAIL && env.DEV_ADMIN_PASSWORD
      ? { email: env.DEV_ADMIN_EMAIL, password: env.DEV_ADMIN_PASSWORD }
      : null;

  return {
    plugins: [react()],
    define: { __DEV_ADMIN__: JSON.stringify(devAdmin) },
    server: {
      https: httpsConfig,
      port: 5173,
    },
  };
});
