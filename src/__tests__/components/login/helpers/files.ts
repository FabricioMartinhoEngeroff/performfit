
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execSync } from "node:child_process";

const TESTS_DIR = "__tests__";
const DEFAULT_EXTENSIONS = [".ts", ".tsx"];

export const ROOT = process.cwd();
export const SRC = join(ROOT, "src");

export const exists = (relPath: string) => existsSync(join(ROOT, relPath));
export const readText = (relPath: string) => readFileSync(join(ROOT, relPath), "utf8");
export const read = (absPath: string) => readFileSync(absPath, "utf8");
export const rel = (abs: string) => relative(ROOT, abs).replace(/\\/g, "/");

export function walk(dir: string, exts: readonly string[] = DEFAULT_EXTENSIONS): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full, exts);
    return exts.some((ext) => full.endsWith(ext)) ? [full] : [];
  });
}

const isTestFile = (abs: string) => relative(SRC, abs).startsWith(TESTS_DIR);

export function productionFiles(sub = "") {
  return walk(join(SRC, sub)).filter((file) => !isTestFile(file));
}


export function authModuleFiles() {
  return [...productionFiles("components/login"), ...productionFiles("router")];
}

let trackedCache: string[] | undefined;

export function trackedFiles(): string[] {
  trackedCache ??= execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  return trackedCache;
}