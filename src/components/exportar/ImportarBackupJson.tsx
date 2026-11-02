import { useRef, useState } from "react";
import {
  aplicarBackup,
  desfazerBackup,
  lerBackup,
  resumirBackup,
  type BackupLido,
  type ResultadoImportacao,
} from "../../utils/backupJson";
import {
  BtnPrimary,
  BtnRow,
  BtnWarning,
  DropIcon,
  DropSub,
  DropText,
  DropZone,
  FileName,
  HiddenInput,
  ResultCard,
  ResultRow,
  ResultTitle,
} from "../adminImport/AdminImport.styles";

export default function ImportarBackupJson() {
  const [backup, setBackup] = useState<BackupLido | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<ResultadoImportacao | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setResult(null);
    setErro(null);
    setBackup(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setBackup(lerBackup(String(e.target?.result ?? "")));
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function confirmar() {
    if (!backup) return;
    setResult(aplicarBackup(backup));
    setBackup(null);
    setFileName(null);
  }

  function desfazer() {
    if (!window.confirm("Desfazer a migração e restaurar os dados anteriores?")) return;
    desfazerBackup();
    setResult(null);
  }

  const resumo = backup ? resumirBackup(backup) : null;

  return (
    <>
      <DropZone
        $dragging={isDragging}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={openFilePicker}
        role="button"
        aria-label="Área de upload do backup JSON"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
      >
        <DropIcon>🗂️</DropIcon>
        <DropText>Selecione o arquivo de backup exportado pelo app</DropText>
        <DropSub>.json (performfit_backup_…)</DropSub>
      </DropZone>

      <HiddenInput
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={onInputChange}
        aria-label="Selecionar backup JSON"
        data-testid="json-input"
      />

      {erro && <FileName role="alert">{fileName}: {erro}</FileName>}

      {resumo && (
        <ResultCard>
          <ResultTitle>{fileName}</ResultTitle>
          <ResultRow>{resumo.exercicios} exercícios</ResultRow>
          <ResultRow>{resumo.registrosDados} treinos salvos</ResultRow>
          {backup?.formato === "completo" ? (
            <>
              <ResultRow>{resumo.registrosLogbook} registros de histórico</ResultRow>
              {resumo.temPlano && <ResultRow>Plano de treino incluído</ResultRow>}
            </>
          ) : (
            <ResultRow>Backup antigo: traz só o último treino de cada exercício, sem o histórico completo.</ResultRow>
          )}
        </ResultCard>
      )}

      {result && (
        <>
          <ResultCard>
            <ResultTitle>
              Migração concluída — {result.dadosAdicionados + result.logbookAdicionados} adicionado
              {result.dadosAdicionados + result.logbookAdicionados !== 1 ? "s" : ""}
            </ResultTitle>
            <ResultRow>Treinos: {result.dadosAdicionados} adicionados · {result.dadosPreservados} já existiam</ResultRow>
            {(result.logbookAdicionados > 0 || result.logbookDuplicados > 0) && (
              <ResultRow>Histórico: {result.logbookAdicionados} adicionados · {result.logbookDuplicados} já existiam</ResultRow>
            )}
            {result.planoRestaurado && <ResultRow>Plano de treino restaurado</ResultRow>}
            {result.sessoesRestauradas && <ResultRow>Configuração das sessões restaurada</ResultRow>}
          </ResultCard>
          <BtnRow>
            <BtnWarning onClick={desfazer}>Desfazer migração</BtnWarning>
          </BtnRow>
        </>
      )}

      <BtnRow>
        <BtnPrimary disabled={!backup} onClick={confirmar}>
          Confirmar migração
        </BtnPrimary>
      </BtnRow>
    </>
  );
}
