import { useState, type ChangeEvent } from "react";
import ImportarPlano from "../plano/ImportarPlano";
import { importarBackupPerformfit, montarBackupPerformfit } from "../../utils/backupPerformfit";
import { carregarPlano, resumoPlano } from "../../utils/planoPerformfit";
import { Cartao, Conteudo, Rotulo, Tela, Texto, Titulo, Topo } from "../progresso/ui";
import { plural } from "../../utils/plural";

const botao = {
  width: "100%", minHeight: 52, borderRadius: 12, fontSize: 17, fontWeight: 600, cursor: "pointer",
  border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit",
  boxSizing: "border-box",
} as const;

function baixarBackup() {
  const blob = new Blob([JSON.stringify(montarBackupPerformfit(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `performfit_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Aba Perfil: treino atual, trocar de ficha (RN-02.4) e backup (RN-08.2). */
export default function Perfil() {
  const [plano, setPlano] = useState(() => carregarPlano());
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  function importarBackup(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      const r = importarBackupPerformfit(String(leitor.result ?? ""));
      if (r.ok) setPlano(carregarPlano());
      setAviso(
        r.ok
          ? { ok: true, texto: `${plural(r.novos, "registro importado", "registros importados")}.` }
          : { ok: false, texto: r.erro },
      );
    };
    leitor.onerror = () => setAviso({ ok: false, texto: "Não foi possível ler o arquivo." });
    leitor.readAsText(arquivo);
  }

  return (
    <Tela>
      <Topo><Titulo>Perfil</Titulo></Topo>
      <Conteudo>
        <Cartao aria-label="Meu treino">
          <Rotulo>Meu treino</Rotulo>
          {plano ? (
            <>
              <Texto style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{resumoPlano(plano)}</Texto>
              <Texto style={{ margin: "4px 0 14px" }}>{plano.treinos.map((t) => t.nome).join(", ")}</Texto>
              <Rotulo>Trocar de ficha</Rotulo>
              <Texto style={{ margin: "0 0 12px", fontSize: 15 }}>
                Importe a planilha nova que o professor enviou. Seu histórico de treinos continua salvo.
              </Texto>
            </>
          ) : (
            <Texto style={{ margin: "0 0 12px" }}>Nenhum treino importado ainda.</Texto>
          )}
          <ImportarPlano onImportado={(p) => setPlano(p)} />
        </Cartao>

        <Cartao aria-label="Backup">
          <Rotulo>Backup</Rotulo>
          <Texto style={{ margin: "0 0 12px" }}>
            Seus treinos ficam salvos neste aparelho. Guarde um backup para não perder nada.
          </Texto>
          {aviso && (
            <p
              role={aviso.ok ? "status" : "alert"}
              style={{
                fontSize: 16, fontWeight: 600, margin: "0 0 12px", padding: "10px 12px", borderRadius: 10,
                background: aviso.ok ? "#dcfce7" : "#fef2f2", color: aviso.ok ? "#166534" : "#991b1b",
              }}
            >
              {aviso.texto}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" onClick={baixarBackup} style={botao}>Exportar backup</button>
            <label style={{ ...botao, background: "#ffffff" }}>
              Importar backup
              <input
                type="file"
                accept="application/json,.json"
                aria-label="Importar backup"
                onChange={importarBackup}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </Cartao>
      </Conteudo>
    </Tela>
  );
}
