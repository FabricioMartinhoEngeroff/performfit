import { useEffect, useMemo, useState } from "react";
import { idDaSessao } from "../../utils/planilhaSessoes";
import { carregarExercicios, lerJSONObjeto } from "../../utils/planoAtual";
import { carregarPlano, textoRepeticoes, treinoSugerido, type ExercicioPlano, type Plano } from "../../utils/planoPerformfit";
import { storageKey } from "../../utils/storage";
import { plural } from "../../utils/plural";
import {
  carregarExecucoes,
  existeTreinoNaData,
  registrarTreino,
  removerTreinoNaData,
  ultimaDataDaSessao,
  type Execucao,
} from "../../utils/execucoes";
import {
  Screen,
  TopBar,
  TopBarTitle,
  DateInput,
  Content,
  Card,
  Label,
  SessaoRow,
  CycleChip,
  ExerciseCard,
  ExName,
  ExSub,
  ObsInput,
  SaveBtn,
  ToastBanner,
  SeriesChecks,
  SerieCheck,
  ProgressoSeries,
  BigBtn,
  NavBtn,
} from "./TreinoSessao.styles";
import { ExerciseGif } from "./ExerciseGif";
import ImportarPlano from "../plano/ImportarPlano";

// Aba Treinar — regras em docs/REGRAS_DE_NEGOCIO.md (RN-02.5, RN-03, RN-04, RN-05).

// ─── Estado de um exercício no treino em andamento ───────────────────────────
// O aluno não anota peso: marca um checkbox por série válida (feitas[i]).

interface ExerciseState {
  feitas: boolean[];
  skipped: boolean;
  obs: string;
}

interface Andamento {
  sessao: string | null;
  states: Record<string, ExerciseState>;
  idx: number;
}

interface TreinoSessaoProps {
  onUnsavedChanges?: (has: boolean) => void;
}

const SEM_SESSAO: Andamento = { sessao: null, states: {}, idx: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayBR(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function parseDateBRToTs(data: string): number {
  const [d, m, y] = data.split("/").map(Number);
  if (!d || !m || !y) return Date.now();
  return new Date(y, m - 1, d).getTime();
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - parseDateBRToTs(dateStr)) / (1000 * 60 * 60 * 24));
}

function estadoVazio(ex: ExercicioPlano): ExerciseState {
  return { feitas: Array<boolean>(ex.series).fill(false), skipped: false, obs: "" };
}

const temProgresso = (s: ExerciseState) => s.skipped || s.obs.trim() !== "" || s.feitas.some(Boolean);
const contarFeitas = (s: ExerciseState | undefined) => s?.feitas.filter(Boolean).length ?? 0;

/** RN-05.3: anotação mais recente do exercício, em qualquer treino. */
function ultimaAnotacao(execs: Execucao[], exercicio: string): string | null {
  let ultima: Execucao | null = null;
  for (const e of execs) {
    if (e.exercicio === exercicio && e.obs && (!ultima || e.dataTs >= ultima.dataTs)) ultima = e;
  }
  return ultima?.obs ?? null;
}

// ─── Rascunho (localStorage, RN-04.10) ───────────────────────────────────────

const DRAFT_KEY = () => storageKey("rascunho_treino");

type DraftStore = Record<string, { states: Record<string, unknown>; currentIdx: number }>;

function loadDraftStore(): DraftStore {
  return lerJSONObjeto<DraftStore>("rascunho_treino");
}

function saveDraft(sessao: string, states: Record<string, ExerciseState>, idx: number) {
  const store = loadDraftStore();
  store[sessao] = { states, currentIdx: idx };
  localStorage.setItem(DRAFT_KEY(), JSON.stringify(store));
}

function clearDraft(sessao: string) {
  const store = loadDraftStore();
  delete store[sessao];
  if (Object.keys(store).length === 0) localStorage.removeItem(DRAFT_KEY());
  else localStorage.setItem(DRAFT_KEY(), JSON.stringify(store));
}

/** Reaproveita do rascunho só o que bate com o plano atual; formato antigo (Top Set) vira estado vazio. */
function restaurarEstado(ex: ExercicioPlano, raw: unknown): ExerciseState {
  const base = estadoVazio(ex);
  if (typeof raw !== "object" || raw === null) return base;
  const r = raw as Partial<Record<keyof ExerciseState, unknown>>;
  const feitas = Array.isArray(r.feitas) ? r.feitas : [];
  return {
    feitas: base.feitas.map((_, i) => feitas[i] === true),
    skipped: r.skipped === true,
    obs: typeof r.obs === "string" ? r.obs : "",
  };
}

function abrirSessao(sessao: string): Andamento {
  const exercicios = carregarExercicios(sessao);
  const draft = loadDraftStore()[sessao];
  const draftStates =
    draft && typeof draft.states === "object" && draft.states !== null ? draft.states : null;
  const states: Record<string, ExerciseState> = {};
  for (const ex of exercicios) states[ex.nome] = restaurarEstado(ex, draftStates?.[ex.nome]);
  const idxRascunho = draftStates && typeof draft?.currentIdx === "number" ? draft.currentIdx : 0;
  const idx = Math.min(Math.max(0, Math.floor(idxRascunho)), Math.max(0, exercicios.length - 1));
  return { sessao, states, idx };
}

/** RN-03.2: em andamento → próximo da sequência → primeiro. */
function sugestao(plano: Plano | null): string | null {
  if (!plano) return null;
  return treinoSugerido(plano, carregarExecucoes(), Object.keys(loadDraftStore()));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TreinoSessao({ onUnsavedChanges }: TreinoSessaoProps = {}) {
  const [plano, setPlano] = useState(() => carregarPlano());
  const [{ sessao, states, idx: currentIdx }, setAndamento] = useState<Andamento>(() => {
    const s = sugestao(plano);
    return s ? abrirSessao(s) : SEM_SESSAO;
  });
  const [data, setData] = useState(getTodayBR());
  const [salvo, setSalvo] = useState(false);
  const [salvarErro, setSalvarErro] = useState<string | null>(null);
  const [confirmarSubstituir, setConfirmarSubstituir] = useState(false);
  const [resumo, setResumo] = useState<{ series: number; exercicios: number } | null>(null);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);

  const treinos = plano?.treinos.map((t) => t.nome) ?? [];
  const exercicios = useMemo(() => (sessao ? carregarExercicios(sessao) : []), [sessao, plano]); // eslint-disable-line react-hooks/exhaustive-deps
  const historico = useMemo(() => carregarExecucoes(), [resumo, plano]); // eslint-disable-line react-hooks/exhaustive-deps
  const proximo = sugestao(plano); // relido a cada render: muda após salvar ou importar
  const currentEx = exercicios[currentIdx] ?? null;
  const sessaoId = sessao ? idDaSessao(sessao) : "";
  const isLastExercise = currentIdx === exercicios.length - 1;

  const hasUnsavedChanges = sessao !== null && Object.values(states).some(temProgresso);

  useEffect(() => {
    if (sessao && hasUnsavedChanges) saveDraft(sessao, states, currentIdx);
  }, [sessao, states, currentIdx, hasUnsavedChanges]);

  useEffect(() => {
    onUnsavedChanges?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  function selecionarSessao(s: string) {
    if (s === sessao) return;
    setAndamento(abrirSessao(s));
    setMostrarRevisao(false);
    setConfirmarSubstituir(false);
    setResumo(null);
    setSalvarErro(null);
  }

  function planoImportado(novo: Plano) {
    setPlano(novo);
    setResumo(null);
    const s = treinoSugerido(novo, carregarExecucoes(), []);
    setAndamento(abrirSessao(s));
  }

  function irPara(idx: number) {
    setAndamento((a) => ({ ...a, idx }));
  }

  function updateState(nome: string, mudar: (s: ExerciseState) => ExerciseState) {
    setAndamento((a) => ({ ...a, states: { ...a.states, [nome]: mudar(a.states[nome]!) } }));
  }

  function alternarSerie(i: number) {
    if (!currentEx) return;
    updateState(currentEx.nome, (s) => ({
      ...s,
      skipped: false,
      feitas: s.feitas.map((v, j) => (j === i ? !v : v)),
    }));
  }

  function nextExercise() {
    if (currentIdx < exercicios.length - 1) irPara(currentIdx + 1);
  }

  function prevExercise() {
    if (currentIdx > 0) irPara(currentIdx - 1);
  }

  function skipExercise() {
    if (!currentEx) return;
    updateState(currentEx.nome, (s) => ({ ...s, skipped: true }));
    nextExercise();
  }

  function isExerciseDone(nome: string): boolean {
    const s = states[nome];
    return !!s && (s.skipped || (s.feitas.length > 0 && s.feitas.every(Boolean)));
  }

  function handleSalvarTreino(forcarSubstituicao = false) {
    if (!sessao) return;

    const ts = parseDateBRToTs(data);
    // RN-04.6 / RN-05.2: pulado não conta séries; com anotação é gravado mesmo sem série ou pulado.
    const feitasDe = (s: ExerciseState) => (s.skipped ? 0 : contarFeitas(s));
    const execucoes: Execucao[] = exercicios
      .filter((ex) => {
        const s = states[ex.nome];
        return !!s && (feitasDe(s) > 0 || s.obs.trim() !== "");
      })
      .map((ex) => {
        const s = states[ex.nome]!;
        return {
          exercicio: ex.nome,
          grupo: ex.grupo,
          sessao,
          sessaoId,
          data,
          dataTs: ts,
          seriesPlanejadas: s.feitas.length,
          seriesFeitas: feitasDe(s),
          ...(s.obs.trim() ? { obs: s.obs.trim() } : {}),
        };
      });

    if (execucoes.length === 0) {
      setSalvarErro("Marque pelo menos uma série ou escreva uma anotação antes de salvar.");
      return;
    }

    if (!forcarSubstituicao && existeTreinoNaData(sessaoId, data)) {
      setConfirmarSubstituir(true);
      return;
    }

    try {
      if (forcarSubstituicao) removerTreinoNaData(sessaoId, data);
      registrarTreino(execucoes);
      clearDraft(sessao);

      setConfirmarSubstituir(false);
      setSalvarErro(null);
      setMostrarRevisao(false);
      setResumo({
        series: execucoes.reduce((t, e) => t + e.seriesFeitas, 0),
        exercicios: execucoes.filter((e) => e.seriesFeitas > 0).length,
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 5000);
      setAndamento(SEM_SESSAO);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Erro ao salvar treino:", err);
      setSalvarErro("Não foi possível salvar o treino. Tente novamente.");
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderDaysSince() {
    if (!sessao) return null;
    const days = daysSince(ultimaDataDaSessao(sessaoId));
    if (days === null) return null;
    return (
      <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
        {plural(days, "dia", "dias")} desde o último {sessao}
      </p>
    );
  }

  const botaoSecundario = {
    width: "100%", minHeight: 48, padding: 10, marginTop: 8, border: "1px solid #d1d5db",
    borderRadius: 10, background: "#fff", color: "#4b5563", fontSize: 16, cursor: "pointer",
  } as const;

  function renderRevisao() {
    if (confirmarSubstituir) {
      return (
        <Card>
          <Label>Atenção</Label>
          <div style={{
            background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8,
            padding: "10px 12px", fontSize: 15, color: "#c2410c", marginBottom: 12, lineHeight: 1.5,
          }}>
            ⚠ Já existe um treino de <strong>{sessao}</strong> salvo em <strong>{data}</strong>. Salvar novamente vai substituir o registro desse dia.
          </div>
          <SaveBtn type="button" onClick={() => handleSalvarTreino(true)} style={{ minHeight: 56, fontSize: 17 }}>
            Substituir registro do dia
          </SaveBtn>
          <button type="button" onClick={() => setConfirmarSubstituir(false)} style={botaoSecundario}>
            Cancelar
          </button>
        </Card>
      );
    }

    return (
      <Card>
        <Label>Revisar antes de salvar</Label>
        {exercicios.map((ex, idx) => {
          const s = states[ex.nome];
          const feitas = contarFeitas(s);
          const done = isExerciseDone(ex.nome);
          return (
            <button
              type="button"
              key={ex.nome}
              onClick={() => { irPara(idx); setMostrarRevisao(false); }}
              aria-label={`Editar ${ex.nome}`}
              style={{
                width: "100%", textAlign: "left", background: "none", border: "none",
                padding: "12px 0", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10,
                borderBottom: idx < exercicios.length - 1 ? "0.5px solid #e5e7eb" : "none",
                fontFamily: "inherit",
              }}
            >
              <span style={{ color: done ? "#16a34a" : "#9ca3af", fontSize: 18, width: 20, flexShrink: 0 }}>
                {done ? "✓" : "○"}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 500, color: "#111827" }}>{ex.nome}</span>
                <span style={{ display: "block", fontSize: 14, color: s?.skipped || feitas === 0 ? "#9ca3af" : "#4b5563" }}>
                  {s?.skipped
                    ? "Pulado"
                    : feitas === 0
                    ? "Nenhuma série marcada"
                    : `${feitas} de ${s!.feitas.length} séries`}
                </span>
              </span>
              <span style={{ fontSize: 14, color: "#2563eb", flexShrink: 0 }}>Editar</span>
            </button>
          );
        })}
        <SaveBtn type="button" onClick={() => handleSalvarTreino()} style={{ marginTop: 12, minHeight: 56, fontSize: 17 }}>
          Confirmar e Salvar Treino
        </SaveBtn>
        <button type="button" onClick={() => setMostrarRevisao(false)} style={botaoSecundario}>
          Voltar ao exercício
        </button>
      </Card>
    );
  }

  function renderExercicio(ex: ExercicioPlano) {
    const state = states[ex.nome] ?? estadoVazio(ex);
    const feitas = contarFeitas(state);
    const completo = feitas === state.feitas.length;
    const reps = textoRepeticoes(ex.repeticoes);
    const anotacaoAnterior = ultimaAnotacao(historico, ex.nome);

    return (
      <ExerciseCard key={ex.nome}>
        <ExName as="h2" style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>
          {ex.nome}
        </ExName>
        <ExSub style={{ fontSize: 14, fontWeight: 600, color: "#2563eb" }}>{ex.grupo}</ExSub>
        <ExSub style={{ fontSize: 15, color: "#111827", margin: "6px 0 2px" }}>
          {plural(state.feitas.length, "série", "séries")}{reps ? ` · ${reps}` : ""}
        </ExSub>
        {ex.comoFazer && <ExSub style={{ fontSize: 15, color: "#374151", marginBottom: 10 }}>{ex.comoFazer}</ExSub>}

        <ExerciseGif exerciseName={ex.nome} />

        <SeriesChecks>
          {state.feitas.map((marcada, i) => (
            <SerieCheck
              key={i}
              type="button"
              role="checkbox"
              aria-checked={marcada}
              aria-label={`Série ${i + 1}`}
              $checked={marcada}
              onClick={() => alternarSerie(i)}
            >
              <span aria-hidden="true">{marcada ? "✓" : ""}</span>
              <span aria-hidden="true">Série {i + 1}</span>
            </SerieCheck>
          ))}
        </SeriesChecks>

        <ProgressoSeries $completo={completo}>
          {feitas} de {state.feitas.length} séries feitas
        </ProgressoSeries>
        {completo && <ProgressoSeries $completo>Exercício concluído</ProgressoSeries>}
        {state.skipped && <ProgressoSeries $completo={false}>Exercício pulado</ProgressoSeries>}

        {anotacaoAnterior && (
          <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "#f0f9ff", border: "0.5px solid #bae6fd" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0369a1" }}>Sua anotação da última vez:</p>
            <p style={{ margin: "2px 0 0", fontSize: 15, color: "#075985", fontStyle: "italic" }}>{anotacaoAnterior}</p>
          </div>
        )}

        <ObsInput
          aria-label="Como você estava neste exercício?"
          placeholder="Como você estava neste exercício? (opcional)"
          rows={2}
          value={state.obs}
          onChange={(e) => {
            const obs = e.target.value;
            updateState(ex.nome, (s) => ({ ...s, obs }));
          }}
          style={{ marginTop: 10, fontSize: 15 }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <BigBtn type="button" $variant="secundario" onClick={skipExercise} style={{ flex: 1 }}>
            Pular
          </BigBtn>
          <BigBtn
            type="button"
            $variant={completo ? "concluido" : "primario"}
            data-destaque={String(completo)}
            onClick={isLastExercise ? () => setMostrarRevisao(true) : nextExercise}
            style={{ flex: 2 }}
          >
            {isLastExercise ? "Ver Resumo" : "Próximo"}
          </BigBtn>
        </div>
      </ExerciseCard>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  if (!plano) {
    return (
      <Screen>
        <TopBar>
          <TopBarTitle>PerformFit</TopBarTitle>
        </TopBar>
        <Content>
          <Card>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Importe seu treino</h2>
            <p style={{ fontSize: 16, color: "#4b5563", margin: "0 0 14px" }}>
              Escolha a planilha que o seu professor enviou. O app monta seus treinos e os dias da semana.
            </p>
            <ImportarPlano onImportado={planoImportado} />
          </Card>
        </Content>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar>
        <TopBarTitle>PerformFit</TopBarTitle>
        <DateInput
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
          aria-label="Data do treino"
          style={{ fontSize: 14 }}
        />
        {renderDaysSince()}
      </TopBar>

      <Content>
        {salvo && (
          <ToastBanner $variant="success" role="status" style={{ fontSize: 16 }}>
            ✅ Treino salvo! Bom trabalho.
          </ToastBanner>
        )}
        {salvarErro && (
          <ToastBanner $variant="error" role="alert" style={{ fontSize: 16 }}>
            ❌ {salvarErro}
          </ToastBanner>
        )}

        <Card>
          <Label>Treino</Label>
          <SessaoRow>
            {treinos.map((s) => (
              <CycleChip
                key={s}
                $active={sessao === s}
                onClick={() => selecionarSessao(s)}
                type="button"
                aria-label={s}
                aria-pressed={sessao === s}
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {s}
              </CycleChip>
            ))}
          </SessaoRow>
          {proximo && (
            <p style={{ fontSize: 14, color: "#4b5563", margin: "8px 0 0" }}>
              Próximo da sequência: {proximo}
            </p>
          )}
        </Card>

        {resumo && (
          <Card>
            <Label>Resumo do treino</Label>
            <p style={{ fontSize: 17, color: "#111827", margin: "4px 0" }}>
              {plural(resumo.series, "série", "séries")} em {plural(resumo.exercicios, "exercício", "exercícios")}
            </p>
          </Card>
        )}

        {sessao && mostrarRevisao && renderRevisao()}

        {sessao && exercicios.length > 0 && !mostrarRevisao && (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                <NavBtn type="button" onClick={prevExercise} disabled={currentIdx === 0} aria-label="Exercício anterior">
                  ‹ Anterior
                </NavBtn>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#4b5563", whiteSpace: "nowrap" }}>
                  {currentIdx + 1} / {exercicios.length}
                </span>
                <NavBtn type="button" onClick={nextExercise} disabled={isLastExercise} aria-label="Próximo exercício">
                  Próximo ›
                </NavBtn>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 320 }}>
                {exercicios.map((ex, idx) => (
                  <div
                    key={ex.nome}
                    onClick={() => irPara(idx)}
                    title={`${ex.nome}${isExerciseDone(ex.nome) ? " ✓" : ""}`}
                    style={{
                      width: 14, height: 14, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
                      background: idx === currentIdx ? "#2563eb" : isExerciseDone(ex.nome) ? "#16a34a" : "#d1d5db",
                      border: idx === currentIdx ? "2px solid #1d4ed8" : "2px solid transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            {currentEx && renderExercicio(currentEx)}
          </>
        )}
      </Content>
    </Screen>
  );
}
