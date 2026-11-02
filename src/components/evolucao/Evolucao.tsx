import { useMemo, useState } from "react";
import { carregarExecucoes } from "../../utils/execucoes";
import { gruposDoPlano } from "../../utils/planoAtual";
import { diasPorSemana } from "../../utils/planoPerformfit";
import {
    periodo,
  resumoSequencia,
  seriesPorGrupo,
  treinosNoPeriodo,
  type StatusSemana,
} from "../../utils/semanas";
import { Cartao, Conteudo, GruposBarras, NavPeriodo, Rotulo, Tela, Texto, Titulo, Topo } from "../progresso/ui";
import { plural } from "../../utils/plural";

const SEMANAS_NO_CALENDARIO = 12;

const ESTILO_SEMANA: Record<StatusSemana, { texto: string; fundo: string; borda: string; simbolo: string }> = {
  completa: { texto: "completa", fundo: "#16a34a", borda: "#16a34a", simbolo: "✓" },
  folga: { texto: "folga", fundo: "#fef3c7", borda: "#f59e0b", simbolo: "–" },
  incompleta: { texto: "incompleta", fundo: "#f3f4f6", borda: "#d1d5db", simbolo: "" },
  atual: { texto: "em andamento", fundo: "#ffffff", borda: "#2563eb", simbolo: "…" },
};

function Numero({ titulo, valor, sufixo, cor }: { titulo: string; valor: number; sufixo: string; cor: string }) {
  return (
    <div
      role="group"
      aria-label={titulo}
      style={{ flex: 1, minWidth: 0, background: "#f9fafb", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}
    >
      <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{titulo}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: cor, lineHeight: 1.2 }}>{valor}</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>{sufixo}</div>
    </div>
  );
}

/** Aba Evolução: sequência de semanas, calendário e séries por grupo no mês/ano. */
export default function Evolucao() {
  const [tipo, setTipo] = useState<"mes" | "ano">("mes");
  const [deslocamento, setDeslocamento] = useState(0);
  const [agora] = useState(() => Date.now());
  const execs = useMemo(() => carregarExecucoes(), []);
  const meta = useMemo(() => diasPorSemana(), []);
  const grupos = useMemo(() => gruposDoPlano(), []);
  const seq = useMemo(() => resumoSequencia(execs, meta, agora), [execs, meta, agora]);

  if (execs.length === 0) {
    return (
      <Tela>
        <Topo><Titulo>Evolução</Titulo></Topo>
        <Conteudo>
          <Cartao>
            <Texto style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>
              Seu primeiro treino aparece aqui
            </Texto>
            <Texto>Marque as séries na aba Treinar e acompanhe suas semanas completas.</Texto>
          </Cartao>
        </Conteudo>
      </Tela>
    );
  }

  const p = periodo(tipo, agora, deslocamento);
  const porGrupo = seriesPorGrupo(execs, p.inicioTs, p.fimTs, grupos);
  const series = porGrupo.reduce((t, g) => t + g.series, 0);
  const treinos = treinosNoPeriodo(execs, p.inicioTs, p.fimTs);
  const calendario = seq.semanas.slice(-SEMANAS_NO_CALENDARIO);

  function trocarTipo(t: "mes" | "ano") {
    setTipo(t);
    setDeslocamento(0);
  }

  const chip = (ativo: boolean) => ({
    flex: 1, minHeight: 48, borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: "pointer",
    border: `1.5px solid ${ativo ? "#2563eb" : "rgba(0,0,0,0.10)"}`,
    background: ativo ? "#2563eb" : "#ffffff", color: ativo ? "#ffffff" : "#4b5563",
  });

  return (
    <Tela>
      <Topo><Titulo>Evolução</Titulo></Topo>
      <Conteudo>
        <Cartao aria-label="Sequência">
          <div style={{ display: "flex", gap: 8 }}>
            <Numero titulo="Sequência atual" valor={seq.atual} sufixo={seq.atual === 1 ? "semana" : "semanas"} cor="#c2410c" />
            <Numero titulo="Recorde" valor={seq.recorde} sufixo={seq.recorde === 1 ? "semana" : "semanas"} cor="#2563eb" />
            <Numero titulo="Semanas completas" valor={seq.total} sufixo="no total" cor="#16a34a" />
          </div>
          <Texto style={{ fontSize: 14 }}>
            Semana completa = {plural(meta, "treino", "treinos")}. Você tem 1 semana de folga por mês sem perder a sequência.
          </Texto>
        </Cartao>

        <Cartao aria-label="Últimas semanas">
          <Rotulo>Últimas semanas</Rotulo>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {calendario.map((s) => {
              const e = ESTILO_SEMANA[s.status];
              const label = periodo("semana", s.inicioTs).label;
              return (
                <div
                  key={s.inicioTs}
                  role="img"
                  aria-label={`${label}: ${e.texto}`}
                  title={`${label}: ${e.texto} (${plural(s.treinos, "treino", "treinos")})`}
                  style={{
                    aspectRatio: "1", borderRadius: 10, background: e.fundo, border: `2px solid ${e.borda}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 700, color: s.status === "completa" ? "#ffffff" : e.borda,
                  }}
                >
                  {e.simbolo}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 12, fontSize: 14, color: "#4b5563" }}>
            {(["completa", "folga", "incompleta", "atual"] as const).map((st) => (
              <span key={st} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 4, display: "inline-block",
                  background: ESTILO_SEMANA[st].fundo, border: `2px solid ${ESTILO_SEMANA[st].borda}`,
                }} />
                {ESTILO_SEMANA[st].texto}
              </span>
            ))}
          </div>
        </Cartao>

        <Cartao aria-label="Séries por grupo muscular no período">
          <Rotulo>Séries por grupo muscular</Rotulo>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" aria-pressed={tipo === "mes"} onClick={() => trocarTipo("mes")} style={chip(tipo === "mes")}>
              Mês
            </button>
            <button type="button" aria-pressed={tipo === "ano"} onClick={() => trocarTipo("ano")} style={chip(tipo === "ano")}>
              Ano
            </button>
          </div>
          <NavPeriodo
            label={p.label}
            rotuloAnterior="Período anterior"
            rotuloProximo="Próximo período"
            onAnterior={() => setDeslocamento((d) => d - 1)}
            onProximo={() => setDeslocamento((d) => Math.min(0, d + 1))}
            podeAvancar={deslocamento < 0}
          />
          <Texto style={{ margin: "0 0 12px", fontWeight: 600 }}>
            {plural(treinos, "treino", "treinos")} · {plural(series, "série", "séries")}
          </Texto>
          <GruposBarras grupos={porGrupo} />
        </Cartao>
      </Conteudo>
    </Tela>
  );
}
