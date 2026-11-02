import { describe, it, expect } from "vitest";
import { exists, productionFiles, read, readText, rel, trackedFiles } from "../helpers/files";

const prod = productionFiles();
const isLogger = (file: string) => /login\/security\/logger\.ts$/.test(rel(file));
const isPurge = (file: string) => /legacyPurge\.ts$/.test(rel(file));

const authFiles = [...productionFiles("components/login"), ...productionFiles("router")].filter(
  (file) => !isLogger(file),
);
const MIN_AUTH_FILES = 5;

const sourceCache = new Map<string, string>();
function source(file: string): string {
  let text = sourceCache.get(file);
  if (text === undefined) {
    text = read(file);
    sourceCache.set(file, text);
  }
  return text;
}

const offenders = (files: string[], pattern: RegExp) =>
  files.filter((file) => pattern.test(source(file))).map(rel);

const offendersContaining = (files: string[], text: string) =>
  files.filter((file) => source(file).includes(text)).map(rel);

describe("G21 — regressões estáticas: credenciais e legado", () => {
  const LEGACY_SYMBOLS = [
    "fake-token-hardcoded",
    "HARDCODED_USERS",
    "parseJWT",
    "@Treino123",
    "segredo-simulado",
    "generateMockJWT",
  ];
  const DELETED_PATHS = [
    "src/data/users.ts",
    "src/contexts/AuthProviderContext.tsx",
    "src/services/authService.ts",
    "src/pages/loginPages", 
  ];

  it("existem módulos de autenticação para inspecionar", () => {
    expect(authFiles.length).toBeGreaterThan(MIN_AUTH_FILES);
  });

  it.each(LEGACY_SYMBOLS)("src/ não contém %s (fora dos testes)", (symbol) => {
    expect(offendersContaining(prod, symbol)).toEqual([]);
  });

  it.each(DELETED_PATHS)("%s não existe mais", (path) => {
    expect(exists(path)).toBe(false);
  });

  it('nenhum localStorage.setItem("token" nem ("email" em src/', () => {
    const setsTokenOrEmail = /(local|session)Storage\.setItem\(\s*["'`](token|email)["'`]/;
    expect(offenders(prod.filter((file) => !isPurge(file)), setsTokenOrEmail)).toEqual([]);
  });
});

describe("G21 — regressões estáticas: higiene das telas de auth", () => {
  const CONSOLE_CALL = /console\.(log|info|warn|error|debug|trace)\s*\(/;
  const ALERT_CALL = /(^|[^\w.])(window\.)?alert\s*\(/m;
  const EMPTY_HASH_LINK = /href=["']#["']/;
  const FORM_PASSED_TO_LOGGER = /logAuthError\([^)]*(formData|form)\b/;

  it("nenhum console.* em módulos de auth (só o logger pode)", () => {
    expect(offenders(authFiles, CONSOLE_CALL)).toEqual([]);
  });

  it("nenhum alert( nos módulos de auth", () => {
    expect(offenders(authFiles, ALERT_CALL)).toEqual([]);
  });

  it("nenhum dangerouslySetInnerHTML nas telas de auth", () => {
    expect(offenders(authFiles, /dangerouslySetInnerHTML/)).toEqual([]);
  });

  it('nenhum <a href="#"> no Login e no Register', () => {
    const screens = authFiles.filter((file) => /ui\/(Login|Register)\.tsx$/.test(rel(file)));
    expect(screens).toHaveLength(2);
    expect(offenders(screens, EMPTY_HASH_LINK)).toEqual([]);
  });

  it("nenhum dispatchEvent/addEventListener('toggleRegister') nas telas", () => {
    expect(offenders(authFiles, /toggleRegister/)).toEqual([]);
  });

  it("módulos de auth (contexts, hooks, ui) não importam handleApiError", () => {
    expect(offenders(authFiles, /handleApiError/)).toEqual([]);
  });

  it("nenhum objeto de formulário é passado ao logger", () => {
    expect(offenders(authFiles, FORM_PASSED_TO_LOGGER)).toEqual([]);
  });
});

describe("G21 — segredos e variáveis de ambiente", () => {
  const ALLOWED_VITE_VARIABLES = new Set([
    "VITE_RAPIDAPI_KEY",
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
  ]);
  const VITE_VARIABLE = /VITE_[A-Z0-9_]+/g;
  const ENV_FILE = /(^|\/)\.env(\..+)?$/;
  const GOOGLE_API_KEY = /AIza[0-9A-Za-z_-]{20,}/;

  const usedViteVariables = (): string[] => [
    ...new Set(prod.flatMap((file) => source(file).match(VITE_VARIABLE) ?? [])),
  ];

  it(".env* está no .gitignore", () => {
    expect(readText(".gitignore")).toMatch(/^\.env\*?$/m);
  });

  it("nenhum .env está rastreado pelo git", () => {
    const envFiles = trackedFiles().filter((file) => ENV_FILE.test(file) && !/\.example$/.test(file));
    expect(envFiles).toEqual([]);
  });

  it("as variáveis VITE_* usadas ficam numa lista permitida", () => {
    expect(usedViteVariables().filter((name) => !ALLOWED_VITE_VARIABLES.has(name))).toEqual([]);
  });

  it("nenhuma variável VITE_* contém 'secret'", () => {
    expect(usedViteVariables().filter((name) => /secret/i.test(name))).toEqual([]);
  });

  it("existe .env.example documentando as variáveis do Firebase (sem valores reais)", () => {
    expect(exists(".env.example")).toBe(true);
    const text = readText(".env.example");
    expect(text).toMatch(/VITE_FIREBASE_API_KEY=\s*$/m);
    expect(text).not.toMatch(GOOGLE_API_KEY);
  });

  it("src/components/login existe onde esperado", () => {
    expect(exists("src/components/login")).toBe(true);
  });
});

describe("G10 — código-fonte do throttle (movido de security/)", () => {
  function sourceOf(pattern: RegExp): string[] {
    const files = productionFiles("components/login").filter((file) => pattern.test(file));
    expect(files, `nenhum arquivo casa ${pattern}`).not.toHaveLength(0);
    return files;
  }

  it("não usa Date.now() diretamente (o relógio é sempre injetado)", () => {
    expect(offenders(sourceOf(/loginThrottle|usePasswordReset/), /Date\.now\(/)).toEqual([]);
  });

  it("não usa localStorage/sessionStorage", () => {
    expect(offenders(sourceOf(/loginThrottle/), /localStorage|sessionStorage/)).toEqual([]);
  });
});
describe("Layout — botão de mostrar senha", () => {
  it("anula o width: 100% global de button (senão o input fica com largura zero)", () => {
    const authField = readText("src/components/login/ui/AuthField.tsx");
    const toggle = authField.match(/const ToggleButton = styled\.button`([^`]*)`/)?.[1] ?? "";
    expect(readText("src/index.css")).toMatch(/button\s*\{[^}]*width:\s*100%/);
    expect(toggle).toMatch(/width:\s*auto/);
    expect(toggle).toMatch(/margin:\s*0/);
  });
});
