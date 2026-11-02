import { useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { lerPlanilha, modeloPlanilha, resumoPlano, salvarPlano, type Plano } from "../../utils/planoPerformfit";

// Importação da planilha do professor (RN-01.6, RN-02): confere tudo, mostra o
// resumo e só grava ao confirmar.

const botao = {
  width: "100%", minHeight: 52, borderRadius: 12, fontSize: 17, fontWeight: 600, cursor: "pointer",
  border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontFamily: "inherit",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box",
} as const;

function baixarModelo() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(modeloPlanilha());
  ws["!cols"] = [{ wch: 10 }, { wch: 7 }, { wch: 22 }, { wch: 16 }, { wch: 7 }, { wch: 12 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, ws, "Treino");
  const dados = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const url = URL.createObjectURL(new Blob([dados], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "performfit_modelo_planilha.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

function linhasDoArquivo(dados: ArrayBuffer, nome: string): unknown[][] {
  const csv = /\.csv$/i.test(nome);
  const wb = csv
    ? XLSX.read(new TextDecoder("utf-8").decode(dados), { type: "string" })
    : XLSX.read(dados, { type: "array" });
  const aba = wb.Sheets[wb.SheetNames[0] ?? ""];
  if (!aba) return [];
  return XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1, defval: "", raw: false });
}

export default function ImportarPlano({ onImportado }: { onImportado?: (plano: Plano) => void }) {
  const [previa, setPrevia] = useState<Plano | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [importado, setImportado] = useState(false);

  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setImportado(false);
    setPrevia(null);
    setErros([]);
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const r = lerPlanilha(linhasDoArquivo(leitor.result as ArrayBuffer, arquivo.name));
        if (r.ok) setPrevia(r.plano);
        else setErros(r.erros);
      } catch {
        setErros(["Não consegui ler este arquivo. Use a planilha do modelo (.xlsx ou .csv)."]);
      }
    };
    leitor.onerror = () => setErros(["Não consegui ler este arquivo."]);
    leitor.readAsArrayBuffer(arquivo);
  }

  function confirmar() {
    if (!previa) return;
    salvarPlano(previa);
    setPrevia(null);
    setImportado(true);
    onImportado?.(previa);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {importado && (
        <p role="status" style={{ margin: 0, padding: "10px 12px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 16, fontWeight: 600 }}>
          Treino importado!
        </p>
      )}

      {erros.length > 0 && (
        <div role="alert" style={{ padding: "10px 12px", borderRadius: 10, background: "#fef2f2", color: "#991b1b", fontSize: 15 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Encontrei problemas na planilha. Nada foi alterado:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {erros.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </div>
      )}

      {previa ? (
        <div style={{ padding: 12, borderRadius: 12, border: "1.5px solid #2563eb", background: "#f8fafc" }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{resumoPlano(previa)}</p>
          <ul style={{ margin: "8px 0 12px", paddingLeft: 20, fontSize: 15, color: "#374151" }}>
            {previa.treinos.map((t) => (
              <li key={t.nome}>{t.nome}: {t.exercicios.map((e) => e.nome).join(", ")}</li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={() => setPrevia(null)} style={{ ...botao, flex: 1, border: "1.5px solid #d1d5db", background: "#fff", color: "#4b5563" }}>
              Cancelar
            </button>
            <button type="button" onClick={confirmar} style={{ ...botao, flex: 2, border: "none", background: "#16a34a", color: "#fff" }}>
              Usar este treino
            </button>
          </div>
        </div>
      ) : (
        <label style={{ ...botao, border: "none", background: "#2563eb", color: "#fff" }}>
          Escolher planilha
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            aria-label="Escolher planilha"
            onChange={escolher}
            style={{ display: "none" }}
          />
        </label>
      )}

      <button type="button" onClick={baixarModelo} style={{ ...botao, background: "#fff" }}>
        Baixar modelo de planilha
      </button>
    </div>
  );
}
