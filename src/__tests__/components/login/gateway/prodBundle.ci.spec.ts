import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { ROOT, walk, read } from "../helpers/files";
import {
  MOCK_USERS_KEY,
  MOCK_SESSION_KEY,
} from "../../../../components/login/gateway/MockAuthGateway";


const FORBIDDEN_IN_PROD: Array<[label: string, marker: string]> = [
  ["MockAuthGateway", "MockAuthGateway"],
  ["o código PBKDF2 do mock", "PBKDF2"],
  ["a chave de usuários do mock", MOCK_USERS_KEY],
  ["a chave de sessão do mock", MOCK_SESSION_KEY],
];

describe.skipIf(!process.env.CHECK_DIST)("G9 — dist de produção", () => {
  const bundles = () => walk(join(ROOT, "dist"), [".js"]);

  it("existe um build para inspecionar", () => {
    expect(bundles().length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN_IN_PROD)("não contém %s", (_label, marker) => {
    for (const file of bundles()) expect(read(file), file).not.toContain(marker);
  });
});