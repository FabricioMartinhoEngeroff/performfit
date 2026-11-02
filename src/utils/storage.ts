import type { DadosTreino, Logbook, RegistroExercicio, RegistroTreino } from "../types/TrainingData";
import {
  comIdUnico,
  dataBRparaISO,
  logbookParaRegistros,
  nomeExercicio,
  paraRegistro,
  registrosParaLogbook,
  sanitizarRegistros,
  slugExercicio,
  type Registro,
} from "./registros";

// ─── User-scoped storage keys ─────────────────────────────────────────────────

// O usuário atual é definido só pelo AuthProvider (setCurrentUser), nunca lido do storage.
let _userId = "";

// Keys that hold real user data (not auth infrastructure)
const USER_DATA_KEYS = ["registros", "logbook", "dadosTreino", "planoTreino", "sessoes_config"];

// No primeiro login após a mudança, migra dados globais pré-existentes
// para as chaves do usuário, para que nada se perca.
function migrateUnscoped(userId: string) {
  USER_DATA_KEYS.forEach((base) => {
    const scopedKey = `gw:${userId}:${base}`;
    const old = localStorage.getItem(base);
    if (old && old !== "{}" && old !== "[]") {
      // Só migra se o destino ainda não existe
      if (!localStorage.getItem(scopedKey)) {
        localStorage.setItem(scopedKey, old);
      }
      // Remove a chave global para que outro usuário não herde esses dados
      localStorage.removeItem(base);
    }
  });
}

export function setCurrentUser(id: string | null) {
  _userId = id ?? "";
  if (_userId) migrateUnscoped(_userId);
}

export function getCurrentUser(): string {
  return _userId;
}

export function storageKey(base: string): string {
  return _userId ? `gw:${_userId}:${base}` : base;
}

// JSON corrompido (ou de tipo inesperado) vira objeto vazio em vez de lançar.
function lerObjeto<T extends object>(key: string): T {
  const raw = localStorage.getItem(key);
  if (!raw) return {} as T;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const salvarDados = (dados: DadosTreino) => {
  const dadosFiltrados: DadosTreino = {};

  for (const exercicio in dados) {
    const filtrado: Record<string, RegistroTreino> = {};
    dadosFiltrados[exercicio] = filtrado;

    for (const ciclo in dados[exercicio]) {
      const reg = dados[exercicio]?.[ciclo];
      if (!reg) continue;
      const pesos = reg.pesos || [];
      const reps = reg.reps || [];
      const obs = reg.obs?.trim() || "";

      const isVazio =
        pesos.every(p => !p || p.trim() === "") &&
        reps.every(r => !r || r.trim() === "") &&
        obs === "";

      if (!isVazio) {
        filtrado[ciclo] = reg;
      }
    }

    if (Object.keys(dadosFiltrados[exercicio]).length === 0) {
      delete dadosFiltrados[exercicio];
    }
  }

  localStorage.setItem(storageKey("dadosTreino"), JSON.stringify(dadosFiltrados));
};


export const carregarDados = (): DadosTreino => lerObjeto<DadosTreino>(storageKey("dadosTreino"));


// ─── Histórico de treinos (formato v3: lista de registros) ────────────────────
// Cada treino salvo vira um registro novo na chave "registros"; nada é sobrescrito.
// O resto do app continua recebendo o Logbook (agrupado por exercício), montado
// a partir dessa lista.

/** Converte o logbook v2 (se existir) na primeira leitura e guarda o original como backup. */
function migrarLogbookV2(): Registro[] | null {
  const antigo = localStorage.getItem(storageKey("logbook"));
  if (antigo === null) return null;
  const lista = logbookParaRegistros(lerObjeto<Logbook>(storageKey("logbook")));
  salvarRegistros(lista);
  localStorage.setItem(storageKey("logbook_v1_backup"), antigo);
  localStorage.removeItem(storageKey("logbook"));
  return lista;
}

export function carregarRegistros(): Registro[] {
  const raw = localStorage.getItem(storageKey("registros"));
  if (raw === null) return migrarLogbookV2() ?? [];
  try {
    return sanitizarRegistros(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function salvarRegistros(lista: Registro[]): void {
  localStorage.setItem(storageKey("registros"), JSON.stringify(lista));
}

/** Guarda uma cópia do histórico para desfazer uma importação. */
export function fotografarRegistros(): void {
  carregarRegistros(); // garante a migração antes da cópia
  localStorage.setItem(storageKey("registros_backup"), localStorage.getItem(storageKey("registros")) ?? "[]");
}

export function restaurarRegistros(): void {
  const salvo = localStorage.getItem(storageKey("registros_backup"));
  if (salvo !== null) localStorage.setItem(storageKey("registros"), salvo);
}

export function limparRegistros(): void {
  localStorage.removeItem(storageKey("registros"));
  localStorage.removeItem(storageKey("logbook"));
}

function carregarLogbook(): Logbook {
  return registrosParaLogbook(carregarRegistros());
}

export function salvarLogbookCompleto(logbook: Logbook): void {
  salvarRegistros(logbookParaRegistros(logbook));
}


export function salvarRegistro(registro: RegistroExercicio): void {
  const lista = carregarRegistros();
  const ids = new Set(lista.map((r) => r.id));
  lista.push(comIdUnico(paraRegistro(registro), ids));
  salvarRegistros(lista);
}


export function carregarHistorico(exercicio: string): RegistroExercicio[] {
  const logbook = carregarLogbook();
  return logbook[nomeExercicio(slugExercicio(exercicio), exercicio)] ?? [];
}


export function existeTreinoNaData(treinoId: string, data: string): boolean {
  const iso = dataBRparaISO(data);
  return carregarRegistros().some((r) => r.sessao === treinoId && r.data === iso);
}


export function removerTreinoNaData(treinoId: string, data: string): void {
  const iso = dataBRparaISO(data);
  salvarRegistros(carregarRegistros().filter((r) => !(r.sessao === treinoId && r.data === iso)));
}


export function ultimoRegistro(exercicio: string, treinoId: string): RegistroExercicio | null {
  const historico = carregarHistorico(exercicio);
  const doTreino = historico.filter((r) => r.treinoId === treinoId);
  if (doTreino.length === 0) return null;
  return doTreino.reduce((a, b) => (a.dataTs > b.dataTs ? a : b));
}


export function exercicioDeveSubirPeso(exercicio: string, treinoId: string): boolean {
  const ultimo = ultimoRegistro(exercicio, treinoId);
  if (!ultimo) return false;
  return ultimo.topSetBateuTeto;
}


export function carregarLogbookCompleto(): Logbook {
  return carregarLogbook();
}
