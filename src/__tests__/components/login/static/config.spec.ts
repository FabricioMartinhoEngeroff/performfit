import { describe, it, expect } from "vitest";
import { exists, readText, trackedFiles } from "../helpers/files";

interface VercelConfig {
  rewrites?: Array<{ source: string; destination: string }>;
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
}

const GLOBAL_HEADER_SOURCES = new Set(["/(.*)", "/:path*", "/(.*)/"]);

const vercel = (): VercelConfig => JSON.parse(readText("vercel.json"));

const headerMap = (): Map<string, string> =>
  new Map(
    (vercel().headers ?? [])
      .filter((block) => GLOBAL_HEADER_SOURCES.has(block.source))
      .flatMap((block) => block.headers)
      .map((header) => [header.key.toLowerCase(), header.value] as const),
  );

const csp = (): Record<string, string[]> =>
  Object.fromEntries(
    (headerMap().get("content-security-policy") ?? "")
      .split(";")
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive): [string, string[]] => {
        const [name = "", ...sources] = directive.split(/\s+/);
        return [name, sources];
      }),
  );

describe("G22 — vercel.json", () => {
  it("mantém o rewrite do SPA", () => {
    expect(vercel().rewrites).toContainEqual({ source: "/(.*)", destination: "/" });
  });

  it("CSP tem as diretivas base", () => {
    const policy = csp();
    expect(policy["default-src"]).toEqual(["'self'"]);
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["base-uri"]).toEqual(["'self'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
    expect(policy["form-action"]).toEqual(["'self'"]);
  });

  it("script-src não tem 'unsafe-inline' nem 'unsafe-eval'", () => {
    const scripts = csp()["script-src"];
    expect(scripts).toBeDefined();
    expect(scripts).not.toContain("'unsafe-inline'");
    expect(scripts).not.toContain("'unsafe-eval'");
  });


  it("connect-src permite só self, Firebase Auth e o proxy da RapidAPI", () => {
    const REQUIRED = [
      "'self'",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com",
      "https://exercisedb.p.rapidapi.com",
    ];
    const ALLOWED = [
      ...REQUIRED,
      "https://www.googleapis.com",
      "https://*.firebaseapp.com",
    ];
    const sources = csp()["connect-src"] ?? [];

    expect(sources).toEqual(expect.arrayContaining(REQUIRED));
    expect(sources.filter((source) => !ALLOWED.includes(source))).toEqual([]);
    expect(sources).not.toContain("*");
    expect(sources).not.toContain("https:");
  });

  it("headers de segurança presentes", () => {
    const headers = headerMap();
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("referrer-policy")).toBeTruthy();
    expect(headers.get("permissions-policy")).toBeTruthy();
    expect(headers.get("strict-transport-security")).toMatch(/max-age=\d{7,}/);
  });
});

describe("G22 — repositório e CI", () => {
  const workflow = () => readText(".github/workflows/workflow-ci.yml");

  it(".gitignore contém .history/ e nenhum arquivo de .history está rastreado", () => {
    expect(readText(".gitignore")).toMatch(/^\/?\.history\/?$/m);
    expect(trackedFiles().filter((file) => file.startsWith(".history/"))).toEqual([]);
  });

  const CI_STEPS: Array<[label: string, pattern: RegExp]> = [
    ["npm ci (instalação reprodutível)", /npm ci/],
    ["npm run lint", /npm run lint/],
    ["tsc --noEmit", /tsc .*--noEmit/],
    ["testes com cobertura", /npm run test:run.*--coverage|npm run test:coverage/],
    ["npm audit das dependências de produção", /npm audit --omit=dev --audit-level=high/],
    ["npm run build", /npm run build/],
    ["verificação do dist (CHECK_DIST=1)", /CHECK_DIST=1|CHECK_DIST:\s*["']?1/],
  ];

  it.each(CI_STEPS)("o workflow de CI executa: %s", (_label, pattern) => {
    expect(workflow()).toMatch(pattern);
  });

  it("cobertura mínima de 90% (linhas e branches) nas pastas de auth", () => {
    const config = readText("vitest.config.ts");
    expect(config).toMatch(/src\/components\/login\/\*\*/);
    expect(config).toMatch(/thresholds/);
    expect(config).toMatch(/lines:\s*90/);
    expect(config).toMatch(/branches:\s*90/);
  });

  it.each(["strict", "noUncheckedIndexedAccess"])("tsconfig.app.json ativa %s", (flag) => {
    expect(readText("tsconfig.app.json")).toMatch(new RegExp(`"${flag}"\\s*:\\s*true`));
  });

  it("ESLint: no-console como erro em src/ (exceto o logger) e no-restricted-globals para alert", () => {
    const eslint = readText("eslint.config.js");
    expect(eslint).toMatch(/['"]no-console['"]\s*:\s*['"]error['"]/);
    expect(eslint).toMatch(/login\/security\/logger\.ts/);
    expect(eslint).toMatch(/no-restricted-globals/);
    expect(eslint).toMatch(/alert/);
  });


  it("dependências novas declaradas: zod e firebase", () => {
    const { dependencies } = JSON.parse(readText("package.json"));
    expect(dependencies).toHaveProperty("zod");
    expect(dependencies).toHaveProperty("firebase");
  });

  it("package-lock.json existe para o npm ci", () => {
    expect(exists("package-lock.json")).toBe(true);
  });
});