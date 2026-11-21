/**
 * Data do treino (docs/REGRAS_DE_NEGOCIO.md RN-11). A data nunca é trocada por hoje em silêncio.
 */
import { describe, it, expect } from "vitest";
import {
  brParaIso,
  diaPorExtenso,
  dataFalada,
  formatarBR,
  isoParaBR,
  parseDataBR,
  validarDataTreino,
} from "../../utils/datas";

const HOJE = new Date(2026, 10, 4, 12).getTime(); // quarta 04/11/2026

describe("parseDataBR", () => {
  it("DD/MM/AAAA vira meia-noite local daquele dia", () => {
    expect(parseDataBR("04/11/2026")).toBe(new Date(2026, 10, 4).getTime());
    expect(parseDataBR("4/1/2026")).toBe(new Date(2026, 0, 4).getTime());
  });

  it("texto inválido ou data que não existe → null (não vira hoje)", () => {
    for (const s of ["", "abc", "31/02/2026", "00/11/2026", "04/13/2026", "04-11-2026", "04/11/26", "04/11/2026x"]) {
      expect(parseDataBR(s)).toBeNull();
    }
  });
});

describe("conversões", () => {
  it("formatarBR, isoParaBR e brParaIso", () => {
    expect(formatarBR(HOJE)).toBe("04/11/2026");
    expect(isoParaBR("2026-10-30")).toBe("30/10/2026");
    expect(isoParaBR("2026-02-31")).toBeNull();
    expect(isoParaBR("")).toBeNull();
    expect(brParaIso("30/10/2026")).toBe("2026-10-30");
    expect(brParaIso("xx")).toBe("");
  });

  it("RN-11.3 dia por extenso", () => {
    expect(diaPorExtenso("04/11/2026")).toBe("Quarta-feira, 04/11/2026");
    expect(diaPorExtenso("01/11/2026")).toBe("Domingo, 01/11/2026");
    expect(diaPorExtenso("31/10/2026")).toBe("Sábado, 31/10/2026");
    expect(diaPorExtenso("inválida")).toBe("");
  });
});

describe("RN-11.4 validarDataTreino", () => {
  it("hoje e dias passados valem", () => {
    expect(validarDataTreino("04/11/2026", HOJE)).toBeNull();
    expect(validarDataTreino("03/11/2026", HOJE)).toBeNull();
    expect(validarDataTreino("15/01/2025", HOJE)).toBeNull();
  });

  it("vazia ou inválida pede para escolher", () => {
    expect(validarDataTreino("", HOJE)).toBe("Escolha o dia do treino.");
    expect(validarDataTreino("31/02/2026", HOJE)).toBe("Escolha o dia do treino.");
  });

  it("futuro não vale", () => {
    expect(validarDataTreino("05/11/2026", HOJE)).toBe("A data do treino não pode ser no futuro.");
  });
});

describe("RN-11.3 dataFalada — por extenso, sem números de mês", () => {
  const hoje = new Date(2026, 10, 4, 12).getTime(); // quarta 04/11/2026

  it("hoje e ontem ganham a palavra na frente", () => {
    expect(dataFalada("04/11/2026", hoje)).toBe("Hoje, quarta-feira, 4 de novembro");
    expect(dataFalada("03/11/2026", hoje)).toBe("Ontem, terça-feira, 3 de novembro");
  });

  it("outros dias do ano: dia da semana e mês por extenso", () => {
    expect(dataFalada("30/10/2026", hoje)).toBe("Sexta-feira, 30 de outubro");
    expect(dataFalada("01/11/2026", hoje)).toBe("Domingo, 1 de novembro");
  });

  it("ano só aparece quando não é o ano atual", () => {
    expect(dataFalada("29/12/2025", hoje)).toBe("Segunda-feira, 29 de dezembro de 2025");
  });

  it("data inválida → vazio", () => {
    expect(dataFalada("", hoje)).toBe("");
    expect(dataFalada("31/02/2026", hoje)).toBe("");
  });
});
