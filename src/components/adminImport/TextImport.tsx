import { useState } from "react";
import {
  carregarLogbookCompleto,
  getCurrentUser,
  salvarLogbookCompleto,
  setCurrentUser,
  storageKey,
} from "../../utils/storage";
import { normalizarSeriesValidas } from "../../utils/seriesValidas";
import type { ExercicioSessao } from "../../data/sessionExercises";
import type { SeriesValidas } from "../../types/TrainingData";
import {
  BtnPrimary,
  BtnRow,
  ResultCard,
  ResultTitle,
  ResultRow,
} from "./AdminImport.styles";
import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  padding-top: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
`;

const SectionSub = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 220px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 12px;
  font-family: "Courier New", monospace;
  line-height: 1.5;
  color: #111827;
  background: #fafafa;
  resize: vertical;
  box-sizing: border-box;
  outline: none;

  &:focus {
    border-color: #2563eb;
    background: #fff;
  }
`;

const ErrorMsg = styled.p`
  font-size: 12px;
  color: #ef4444;
  margin: 8px 0 0;
`;

const HelpText = styled.details`
  margin: 10px 0 14px;
  font-size: 11px;
  color: #6b7280;

  summary {
    cursor: pointer;
    font-weight: 500;
    color: #2563eb;
  }

  pre {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 10px 12px;
    margin: 8px 0 0;
    font-size: 11px;
    overflow-x: auto;
    line-height: 1.6;
  }
`;

interface ParsedSession {
  sessao: string;
  exercicios: ExercicioSessao[];
}

function parseText(text: string): { sessions: ParsedSession[]; errors: string[] } {
  const lines = text.split("\n");
  const sessions: ParsedSession[] = [];
  const errors: string[] = [];
  let current: ParsedSession | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? "").trim();
    if (!raw) continue;

    const headerMatch = raw.match(/^##\s+(.+)$/);
    if (headerMatch) {
      current = { sessao: (headerMatch[1] ?? "").trim(), exercicios: [] };
      sessions.push(current);
      continue;
    }

    if (!current) {
      errors.push(`Linha ${i + 1}: "${raw}" — falta o cabeçalho da sessão (ex: ## Upper A)`);
      continue;
    }

    const parts = raw.split("|").map((s) => s.trim());
    if (parts.length < 2) {
      errors.push(`Linha ${i + 1}: formato inválido — use: Nome | Grupo | top min-max | backoff min-max | peso kg`);
      continue;
    }

    const nome = parts[0] ?? "";
    const grupo = parts[1] || "Outro";

    let faixaTopSet: [number, number] = [8, 10];
    let faixaBackoff: [number, number] = [10, 12];
    let seriesValidas: SeriesValidas = 2;
    let topSetKg: number | null = null;

    if (parts[2]) {
      const topMatch = parts[2].match(/(\d+)\s*[-–]\s*(\d+)/);
      if (topMatch) faixaTopSet = [Number(topMatch[1]), Number(topMatch[2])];
    }

    if (parts[3]) {
      const boMatch = parts[3].match(/(\d+)\s*[-–]\s*(\d+)/);
      if (boMatch) faixaBackoff = [Number(boMatch[1]), Number(boMatch[2])];
    }

    if (parts[4]) {
      const kgMatch = parts[4].match(/([\d.]+)/);
      if (kgMatch) topSetKg = Number(kgMatch[1]);
    }

    if (parts[5]) {
      const serMatch = parts[5].match(/(\d)/);
      if (serMatch) seriesValidas = normalizarSeriesValidas(serMatch[1]);
    }

    const ex: ExercicioSessao = {
      nome,
      grupo,
      faixaTopSet,
      faixaBackoff,
      backoffPct: 0.9,
      seriesValidas,
      tecnica: null,
      cue: "",
    };

    if (topSetKg) {
      (ex as ExercicioSessao & { topSetKg: number }).topSetKg = topSetKg;
    }

    current.exercicios.push(ex);
  }

  return { sessions, errors };
}

const TREINO_ID_MAP: Record<string, string> = {
  "Upper A": "UA", "Upper B": "UB", "Lower A": "LA", "Lower B": "LB", "Braço": "BR",
};

export default function TextImport() {
  // O treino é salvo na conta autenticada (escopo definido pelo AuthProvider).
  const loggedInUser = getCurrentUser();
  const targetUser = loggedInUser;
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ sessoes: number; exercicios: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function salvar() {
    const { sessions, errors: parseErrors } = parseText(text);

    if (parseErrors.length > 0) {
      setErrors(parseErrors);
      setResult(null);
      return;
    }

    if (sessions.length === 0) {
      setErrors(["Nenhuma sessão encontrada. Use ## Nome da Sessão para iniciar."]);
      return;
    }

    setCurrentUser(targetUser);
    try {
      const sessoesConfig: Record<string, ExercicioSessao[]> = {};
      const logbook = carregarLogbookCompleto();
      const dadosTreino = JSON.parse(localStorage.getItem(storageKey("dadosTreino")) || "{}");
      const planoNovo: Record<string, Record<string, { ordem: number; series_validas: number }>> = {};
      let totalEx = 0;

      const today = new Date().toLocaleDateString("pt-BR");
      const todayTs = Date.now();

      sessions.forEach(({ sessao, exercicios }) => {
        sessoesConfig[sessao] = exercicios.map((ex) => {
          const rest: ExercicioSessao & { topSetKg?: number } = { ...ex };
          delete rest.topSetKg;
          return rest;
        });
        const planoSessao = planoNovo[sessao] ?? {};
        planoNovo[sessao] = planoSessao;

        exercicios.forEach((ex, idx) => {
          planoSessao[ex.nome] = {
            ordem: idx + 1,
            series_validas: ex.seriesValidas,
          };
          totalEx++;

          const topSetKg = (ex as ExercicioSessao & { topSetKg?: number }).topSetKg;
          if (topSetKg && topSetKg > 0) {
            const treinoId = TREINO_ID_MAP[sessao] ?? sessao.substring(0, 2).toUpperCase();
            const boKg = topSetKg; // Top Set 2 espelha o Top Set 1 no plano importado

            (logbook[ex.nome] ??= []).push({
              exercicio: ex.nome,
              treinoId,
              data: today,
              dataTs: todayTs,
              topSetKg,
              topSetReps: 0,
              topSetFaixaMin: ex.faixaTopSet[0],
              topSetFaixaMax: ex.faixaTopSet[1],
              topSetBateuTeto: false,
              backoffKg: boKg,
              backoffReps: 0,
              backoffFaixaMin: ex.faixaBackoff[0],
              backoffFaixaMax: ex.faixaBackoff[1],
              seriesValidas: ex.seriesValidas,
              progrediu: false,
              obs: "Importado via texto",
            });

            if (!dadosTreino[ex.nome]) dadosTreino[ex.nome] = {};
            dadosTreino[ex.nome][treinoId] = {
              data: today,
              pesos: [String(topSetKg), String(boKg)],
              reps: ["", ""],
              obs: "Importado via texto",
              exercicio: ex.nome,
            };
          }
        });
      });

      localStorage.setItem(storageKey("sessoes_config"), JSON.stringify(sessoesConfig));
      salvarLogbookCompleto(logbook);
      localStorage.setItem(storageKey("dadosTreino"), JSON.stringify(dadosTreino));
      localStorage.setItem(storageKey("planoTreino"), JSON.stringify(planoNovo));
      localStorage.removeItem(storageKey("rascunho_treino"));

      setResult({ sessoes: sessions.length, exercicios: totalEx });
      setErrors([]);
    } finally {
      setCurrentUser(loggedInUser);
    }
  }

  return (
    <Wrapper>
      <SectionTitle>Importar treino via texto</SectionTitle>
      <SectionSub>Cole o treino no formato abaixo e salve na sua conta</SectionSub>

      <HelpText>
        <summary>Ver formato esperado</summary>
        <pre>{`## Upper A
Supino reto barra | Peitoral | 5-9 | 9-15 | 100kg | 2
Crossover braço estendido | Peitoral | 9-15 | 9-15

## Lower A
Agachamento livre | Quadríceps | 5-8 | 8-10 | 120kg | 3
Cadeira extensora | Quadríceps | 8-10 | 10-12

Formato por linha:
Nome | Grupo | Top min-max | Backoff min-max | Peso kg (opcional) | Séries (opcional, padrão 2)`}</pre>
      </HelpText>

      <TextArea
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null); setErrors([]); }}
        placeholder={`## Upper A\nSupino reto barra | Peitoral | 5-9 | 9-15 | 100kg\nCrossover | Peitoral | 9-15 | 9-15\n\n## Lower A\nAgachamento livre | Quadríceps | 5-8 | 8-10 | 120kg | 3`}
        data-testid="text-import-input"
      />

      {errors.length > 0 && errors.map((e, i) => <ErrorMsg key={i}>{e}</ErrorMsg>)}

      {result && (
        <ResultCard>
          <ResultTitle>
            Treino salvo
          </ResultTitle>
          <ResultRow>{result.sessoes} sessão(ões) com {result.exercicios} exercícios</ResultRow>
        </ResultCard>
      )}

      <BtnRow>
        <BtnPrimary disabled={!text.trim()} onClick={salvar}>
          Salvar treino
        </BtnPrimary>
      </BtnRow>
    </Wrapper>
  );
}
