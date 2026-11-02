import { describe, it, expect, vi, afterEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  timingSafeEqual,
  needsRehash,
  DEFAULT_ITERATIONS,
} from "../../../../components/login/crypto/passwordHash";
import { TEST_ITERATIONS } from "../helpers/fixtures";

const PW = "Segredo!123";
const SALT_BYTES = 16;
const EXPECTED_DEFAULT_ITERATIONS = 600_000;
const WEAK_ITERATIONS = 500;
const SLOW_TEST_TIMEOUT_MS = 30_000;
const MAX_LENGTH_PASSWORD = "Aa1!".padEnd(128, "z");
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const fromB64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const bytes = (...values: number[]) => new Uint8Array(values);
const hashFast = (password: string = PW) => hashPassword(password, TEST_ITERATIONS);
const recordWith = (iterations: number) => ({ hash: "", salt: "", iterations });

const spyOnDeriveBits = () => vi.spyOn(crypto.subtle, "deriveBits");
const firstAlgorithm = (spy: { mock: { calls: ReadonlyArray<ReadonlyArray<unknown>> } }) =>
  spy.mock.calls[0]![0] as Pbkdf2Params;

afterEach(() => vi.restoreAllMocks());

describe("G3 — hashPassword", () => {
  it("devolve hash em base64, sem conter a senha", async () => {
    const record = await hashFast();
    expect(record.hash).toMatch(BASE64);
    expect(record.hash).not.toContain(PW);
    expect(JSON.stringify(record)).not.toContain(PW);
  });

  it("o salt tem 16 bytes e é aleatório entre chamadas", async () => {
    const a = await hashFast();
    const b = await hashFast();
    expect(fromB64(a.salt)).toHaveLength(SALT_BYTES);
    expect(fromB64(b.salt)).toHaveLength(SALT_BYTES);
    expect(a.salt).not.toBe(b.salt);
  });

  it("mesma senha com salts diferentes → hashes diferentes", async () => {
    const a = await hashFast();
    const b = await hashFast();
    expect(a.hash).not.toBe(b.hash);
  });

  it("grava as iterações no registro", async () => {
    expect((await hashFast()).iterations).toBe(TEST_ITERATIONS);
  });

  it(
    "o padrão é 600.000 iterações PBKDF2-SHA-256",
    async () => {
      expect(DEFAULT_ITERATIONS).toBe(EXPECTED_DEFAULT_ITERATIONS);
      const spy = spyOnDeriveBits();

      const record = await hashPassword(PW);

      const algorithm = firstAlgorithm(spy);
      expect(record.iterations).toBe(EXPECTED_DEFAULT_ITERATIONS);
      expect(algorithm.name).toBe("PBKDF2");
      expect(algorithm.hash).toBe("SHA-256");
      expect(algorithm.iterations).toBe(EXPECTED_DEFAULT_ITERATIONS);
    },
    SLOW_TEST_TIMEOUT_MS,
  );

  it("não usa Math.random para o salt", async () => {
    const spy = vi.spyOn(Math, "random");
    await hashFast();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("G3 — verifyPassword", () => {
  it("senha correta → true", async () => {
    const record = await hashFast();
    expect(await verifyPassword(PW, record)).toBe(true);
  });

  it("senha incorreta ou vazia → false", async () => {
    const record = await hashFast();
    expect(await verifyPassword("outra", record)).toBe(false);
    expect(await verifyPassword("", record)).toBe(false);
  });

  it("não normaliza a senha (espaços e caixa importam)", async () => {
    const record = await hashFast("abc");
    expect(await verifyPassword(" abc", record)).toBe(false);
    expect(await verifyPassword("ABC", record)).toBe(false);
  });

  it("verifica com as iterações gravadas: trocá-las quebra a verificação", async () => {
    const record = await hashFast();
    expect(await verifyPassword(PW, record)).toBe(true);
    expect(await verifyPassword(PW, { ...record, iterations: TEST_ITERATIONS + 1 })).toBe(false);
  });

  it("deriva com as iterações do registro, não com o padrão", async () => {
    const record = await hashFast();
    const spy = spyOnDeriveBits();

    await verifyPassword(PW, record);

    expect(firstAlgorithm(spy).iterations).toBe(TEST_ITERATIONS);
  });

  it("unicode e emoji funcionam", async () => {
    const password = "Sénha-çãõ-🔐-日本語";
    const record = await hashFast(password);
    expect(await verifyPassword(password, record)).toBe(true);
    expect(await verifyPassword("Senha-cao-🔐-日本語", record)).toBe(false);
  });

  it("senha de 128 caracteres funciona", async () => {
    const record = await hashFast(MAX_LENGTH_PASSWORD);
    expect(await verifyPassword(MAX_LENGTH_PASSWORD, record)).toBe(true);
  });

  it("registro com hash de tamanho diferente → false sem lançar", async () => {
    const record = await hashFast();
    await expect(verifyPassword(PW, { ...record, hash: "AAAA" })).resolves.toBe(false);
  });
});

describe("G3 — timingSafeEqual próprio", () => {
  it("iguais → true; diferentes → false", () => {
    expect(timingSafeEqual(bytes(1, 2, 3), bytes(1, 2, 3))).toBe(true);
    expect(timingSafeEqual(bytes(1, 2, 3), bytes(1, 2, 4))).toBe(false);
  });

  it("tamanhos diferentes → false sem lançar", () => {
    expect(() => timingSafeEqual(bytes(1), bytes(1, 2))).not.toThrow();
    expect(timingSafeEqual(bytes(1), bytes(1, 2))).toBe(false);
  });

  it("vazios → true", () => {
    expect(timingSafeEqual(bytes(), bytes())).toBe(true);
  });
});

describe("G3 — needsRehash", () => {
  it("registro com menos iterações que o alvo → true", () => {
    expect(needsRehash(recordWith(WEAK_ITERATIONS), TEST_ITERATIONS)).toBe(true);
  });

  it("com iterações iguais ou maiores → false", () => {
    expect(needsRehash(recordWith(TEST_ITERATIONS), TEST_ITERATIONS)).toBe(false);
    expect(needsRehash(recordWith(TEST_ITERATIONS * 2), TEST_ITERATIONS)).toBe(false);
  });
});