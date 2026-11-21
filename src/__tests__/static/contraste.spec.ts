/**
 * RN-09.5 — contraste para tela de celular ao ar livre.
 * Cinza de texto/ícone/borda de controle: #6b7280 ou mais escuro.
 */
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { productionFiles, read, rel, SRC } from "../components/login/helpers/files";

const arquivos = [...productionFiles("components"), join(SRC, "App.tsx")];

const ofensores = (padrao: RegExp) => arquivos.filter((f) => padrao.test(read(f))).map(rel);

describe("RN-09.5 contraste", () => {
  it("analisa os arquivos de tela", () => {
    expect(arquivos.length).toBeGreaterThan(10);
  });

  it("não usa o cinza claro #9ca3af em lugar nenhum", () => {
    expect(ofensores(/#9ca3af/i)).toEqual([]);
  });

  it("#d1d5db nunca é cor de texto (nem desativado nem placeholder)", () => {
    // `color:` de CSS ou `color=` de ícone, mas não `border-color`.
    expect(ofensores(/(?<![-\w])color\s*[:=][^;\n]*#d1d5db/i)).toEqual([]);
  });

  it("menu de baixo: abas inativas em #6b7280 ou mais escuro", () => {
    const nav = read(join(SRC, "components/layout/BottomNav.tsx"));
    expect(nav).toMatch(/\$active \? "#2563eb" : "#(6b7280|4b5563|374151)"/);
  });
});
