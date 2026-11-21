import type { VitePWAOptions } from "vite-plugin-pwa";

// Instalar no celular — docs/REGRAS_DE_NEGOCIO.md RN-12.
// Usado pelo vite.config.ts e verificado em src/__tests__/pwa/pwa.spec.ts.

export const pwaOptions: Partial<VitePWAOptions> = {
  // RN-12.2: versão nova substitui a velha sozinha.
  registerType: "autoUpdate",
  // Arquivo registerSW.js separado: respeita o CSP "script-src 'self'" do vercel.json.
  injectRegister: "script",
  includeAssets: ["favicon.svg", "apple-touch-icon.png"],
  manifest: {
    name: "PerformFit",
    short_name: "PerformFit",
    description: "Treino e performance encaixados na sua vida",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#2563eb",
    background_color: "#f5f6fa",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    // RN-12.1: o app inteiro fica no celular e abre sem internet.
    globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
    navigateFallback: "/index.html",
    cleanupOutdatedCaches: true,
    // O pacote principal passa de 2 MB (limite padrão do Workbox).
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  },
  // Sem service worker no `npm run dev`: evita testar uma versão velha em cache.
  devOptions: { enabled: false },
};
