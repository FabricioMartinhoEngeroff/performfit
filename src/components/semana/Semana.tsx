import { useMemo, useState } from "react";
import { carregarExecucoes } from "../../utils/execucoes";
import { gruposDoPlano } from "../../utils/planoAtual";
import { diasPorSemana } from "../../utils/planoPerformfit";
import { periodo, resumoSequencia, seriesPorGrupo, treinosNaSemana } from "../../utils/semanas";
import { Cartao, Conteudo, Destaque, GruposBarras, NavPeriodo, Rotulo, Tela, Texto, Titulo, Topo } from "../progresso/ui";
import { plural } from "../../utils/plural";

/** Aba Semana: treinos da semana contra a meta e séries por grupo muscular. */
export default function Semana() {
  const [deslocamento, setDeslocamento] = useState(0);
  const [agora] = useState(() => Date.now());
  const execs = useMemo(() => carregarExecucoes(), []);
  const meta = useMemo(() => diasPorSemana(), []);
  const grupos = useMemo(() => gruposDoPlano(), []);
  const sequencia = useMemo(() => resumoSequencia(execs, meta, agora), [execs, meta, agora]);

  const semana = periodo("semana", agora, deslocamento);
  const treinos = treinosNaSemana(execs, semana.inicioTs);
  const porGrupo = seriesPorGrupo(execs, semana.inicioTs, semana.fimTs, grupos);
  const totalSeries = porGrupo.reduce((t, g) => t + g.series, 0);
  const completa = treinos >= meta;
  const faltam = meta - treinos;
  const ehAtual = deslocamento === 0;

  return (
    <Tela>
      <Topo>
        <Titulo>{ehAtual ? "Esta semana" : "Semana"}</Titulo>
      </Topo>
      <Conteudo>
        <NavPeriodo
          label={semana.label}
          rotuloAnterior="Semana anterior"
          rotuloProximo="Próxima semana"
          onAnterior={() => setDeslocamento((d) => d - 1)}
          onProximo={() => setDeslocamento((d) => Math.min(0, d + 1))}
          podeAvancar={!ehAtual}
        />

        <Cartao aria-label="Treinos da semana">
          <Rotulo>Treinos</Rotulo>
          <Destaque $cor={completa ? "#16a34a" : undefined}>{treinos} de {meta} treinos</Destaque>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }} aria-hidden="true">
            {Array.from({ length: Math.max(meta, treinos) }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 14, borderRadius: 7,
                  background: i < treinos ? "#16a34a" : "#e5e7eb",
                }}
              />
            ))}
          </div>
          {completa ? (
            <Texto style={{ color: "#16a34a", fontWeight: 700 }}>Semana completa!</Texto>
          ) : ehAtual ? (
            <Texto>
              {faltam === 1 ? "Falta 1 treino" : `Faltam ${faltam} treinos`} para fechar a semana
            </Texto>
          ) : null}
          {ehAtual && (
            <Texto style={{ marginTop: 10, fontWeight: 600, color: sequencia.atual > 0 ? "#c2410c" : "#4b5563" }}>
              {sequencia.atual > 0 ? (
                <>
                  <span aria-hidden="true">🔥 </span>
                  <span>{plural(sequencia.atual, "semana seguida", "semanas seguidas")}</span>
                </>
              ) : (
                "Feche esta semana para começar sua sequência"
              )}
            </Texto>
          )}
        </Cartao>

        <Cartao aria-label="Séries por grupo muscular">
          <Rotulo>Séries por grupo muscular</Rotulo>
          <Texto style={{ margin: "0 0 12px" }}>{plural(totalSeries, "série", "séries")} no total</Texto>
          <GruposBarras grupos={porGrupo} />
        </Cartao>
      </Conteudo>
    </Tela>
  );
}
