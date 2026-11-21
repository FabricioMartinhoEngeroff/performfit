// Data do treino — docs/REGRAS_DE_NEGOCIO.md RN-11.
// Regra principal: data ruim nunca vira "hoje" em silêncio (RN-11.4).

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

const dois = (n: number) => String(n).padStart(2, "0");

/** Meia-noite local da data, se ela existir de verdade. */
function dataReal(ano: number, mes: number, dia: number): number | null {
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia ? d.getTime() : null;
}

/** "DD/MM/AAAA" → timestamp da meia-noite local; qualquer outra coisa → null. */
export function parseDataBR(s: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  return m ? dataReal(Number(m[3]), Number(m[2]), Number(m[1])) : null;
}

export function formatarBR(ts: number): string {
  const d = new Date(ts);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "AAAA-MM-DD" (valor do input type="date") → "DD/MM/AAAA". */
export function isoParaBR(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const ts = m ? dataReal(Number(m[1]), Number(m[2]), Number(m[3])) : null;
  return ts === null ? null : formatarBR(ts);
}

/** "DD/MM/AAAA" → "AAAA-MM-DD"; inválida → "". */
export function brParaIso(br: string): string {
  const ts = parseDataBR(br);
  if (ts === null) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** RN-11.3: "Quarta-feira, 04/11/2026". */
export function diaPorExtenso(br: string): string {
  const ts = parseDataBR(br);
  return ts === null ? "" : `${DIAS[new Date(ts).getDay()]}, ${formatarBR(ts)}`;
}

/** RN-11.4: mensagem de erro, ou null se a data serve. */
export function validarDataTreino(br: string, hojeTs = Date.now()): string | null {
  const ts = parseDataBR(br);
  if (ts === null) return "Escolha o dia do treino.";
  const h = new Date(hojeTs);
  if (ts > new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime()) {
    return "A data do treino não pode ser no futuro.";
  }
  return null;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "4 de novembro" (com " de 2025" se `comAno`). */
export function diaEMes(ts: number, comAno = false): string {
  const d = new Date(ts);
  return `${d.getDate()} de ${MESES[d.getMonth()]}${comAno ? ` de ${d.getFullYear()}` : ""}`;
}

/** RN-11.3: "Hoje, quarta-feira, 4 de novembro" / "Sexta-feira, 30 de outubro" / "…de 2025". */
export function dataFalada(br: string, hojeTs = Date.now()): string {
  const ts = parseDataBR(br);
  if (ts === null) return "";
  const d = new Date(ts);
  const h = new Date(hojeTs);
  const hoje = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime();
  const ontem = new Date(h.getFullYear(), h.getMonth(), h.getDate() - 1).getTime();
  const semana = DIAS[d.getDay()]!;
  const resto = diaEMes(ts, d.getFullYear() !== h.getFullYear());
  if (ts === hoje) return `Hoje, ${semana.toLowerCase()}, ${resto}`;
  if (ts === ontem) return `Ontem, ${semana.toLowerCase()}, ${resto}`;
  return `${semana}, ${resto}`;
}
