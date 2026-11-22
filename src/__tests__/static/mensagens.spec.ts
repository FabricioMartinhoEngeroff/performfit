/**
 * RN-13.1 / RN-13.2 — telas do aluno não usam window.confirm nem escrevem a pergunta de sair.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TELAS_DO_ALUNO = [
  "App.tsx",
  "components/treinoSessao/TreinoSessao.tsx",
  "components/semana/Semana.tsx",
  "components/evolucao/Evolucao.tsx",
  "components/perfil/Perfil.tsx",
];
const ler = (rel: string) => readFileSync(resolve(__dirname, "../..", rel), "utf-8");

describe("RN-13 mensagens só pelo módulo", () => {
  it.each(TELAS_DO_ALUNO)("%s não usa window.confirm", (arq) => {
    expect(ler(arq)).not.toMatch(/\bconfirm\(/);
  });

  it.each(TELAS_DO_ALUNO)("%s não repete o texto das confirmações", (arq) => {
    expect(ler(arq)).not.toMatch(/alterações não salvas|Seu treino ainda não foi salvo/);
  });

  it("o aviso de fechar a página fica só no módulo (não duplicado no TreinoSessao)", () => {
    expect(ler("components/treinoSessao/TreinoSessao.tsx")).not.toMatch(/beforeunload/);
  });
});

describe("RN-14.1 ErroBoundary em volta de tudo", () => {
  it("main.tsx envolve o app com o ErroBoundary", () => {
    const main = ler("main.tsx");
    expect(main).toMatch(/import \{ ErroBoundary, TelaDeErro \} from "\.\/mensagens\/TelaDeErro"/);
    expect(main.indexOf("<ErroBoundary>")).toBeLessThan(main.indexOf("<AuthProvider"));
  });

  it("falha ao iniciar o app também mostra a tela de erro", () => {
    expect(ler("main.tsx")).toMatch(/bootstrap\(\)\.catch\([\s\S]*render\(<TelaDeErro \/>\)/);
  });

  it("Perfil usa o mesmo baixarBackup (sem cópia do código)", () => {
    const perfil = ler("components/perfil/Perfil.tsx");
    expect(perfil).not.toMatch(/function baixarBackup/);
    expect(perfil).toMatch(/baixarBackup/);
  });
});
