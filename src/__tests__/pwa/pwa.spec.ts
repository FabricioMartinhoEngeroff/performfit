/**
 * RN-12 — instalar no celular (PWA): manifesto, ícones, service worker e index.html.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pwaOptions } from "../../pwa/config";

const ROOT = process.cwd();
const publico = (src: string) => join(ROOT, "public", src.replace(/^\//, ""));

/** Largura e altura de um PNG (cabeçalho IHDR). */
function tamanhoPng(arquivo: string): [number, number] {
  const b = readFileSync(arquivo);
  expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

const manifest = pwaOptions.manifest as Exclude<typeof pwaOptions.manifest, false | undefined>;

describe("RN-12.1 manifesto", () => {
  it("nome, tela cheia, retrato, cores e início", () => {
    expect(manifest).toMatchObject({
      name: "PerformFit",
      short_name: "PerformFit",
      lang: "pt-BR",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      theme_color: "#2563eb",
      background_color: "#f5f6fa",
    });
    expect(manifest.description).toBe("Treino e performance encaixados na sua vida");
  });

  it("ícones 192 e 512 (um maskable) existem e têm o tamanho declarado", () => {
    const icones = manifest.icons ?? [];
    const tamanhos = icones.map((i) => i.sizes);
    expect(tamanhos).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icones.some((i) => i.purpose === "maskable" && i.sizes === "512x512")).toBe(true);
    for (const i of icones) {
      const arquivo = publico(i.src);
      expect(existsSync(arquivo), i.src).toBe(true);
      const [w, h] = tamanhoPng(arquivo);
      expect(`${w}x${h}`).toBe(i.sizes);
      expect(i.type).toBe("image/png");
    }
  });
});

describe("RN-12.1 / RN-12.2 service worker", () => {
  it("atualiza sozinho e é registrado automaticamente", () => {
    expect(pwaOptions.registerType).toBe("autoUpdate");
    expect(pwaOptions.injectRegister).toBe("script");
  });

  it("guarda o app para abrir sem internet", () => {
    const wb = pwaOptions.workbox!;
    expect(wb.navigateFallback).toBe("/index.html");
    expect(wb.globPatterns?.join()).toMatch(/js.*css.*html|html.*js.*css/);
    expect(wb.cleanupOutdatedCaches).toBe(true);
  });

  it("não fica ativo no `npm run dev` (evita versão velha em cache durante o desenvolvimento)", () => {
    expect(pwaOptions.devOptions?.enabled ?? false).toBe(false);
  });

  it("vite.config usa a configuração", () => {
    const vite = readFileSync(join(ROOT, "vite.config.ts"), "utf8");
    expect(vite).toMatch(/VitePWA\(pwaOptions\)/);
  });
});

describe("RN-12.1 index.html", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");

  it("cor do tema e ícone para iPhone", () => {
    expect(html).toMatch(/<meta name="theme-color" content="#2563eb"/);
    const apple = html.match(/<link rel="apple-touch-icon" href="([^"]+)"/);
    expect(apple).not.toBeNull();
    expect(existsSync(publico(apple![1]!))).toBe(true);
    expect(tamanhoPng(publico(apple![1]!))).toEqual([180, 180]);
  });

  it("ícone da aba existe (não aponta para o /vite.svg que não existe)", () => {
    expect(html).not.toContain("/vite.svg");
    const icon = html.match(/<link rel="icon"[^>]*href="([^"]+)"/);
    expect(icon).not.toBeNull();
    expect(existsSync(publico(icon![1]!))).toBe(true);
  });
});
