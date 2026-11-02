import { describe, it, expect, vi, afterEach } from "vitest";
import { createLoginThrottle } from "../../../../components/login/security/loginThrottle";
import { SECOND, createFakeClock } from "../helpers/fixtures";

afterEach(() => vi.restoreAllMocks());

const EMAIL = "a@b.com";
const FAILURES_BEFORE_LOCK = 5;
const FIRST_LOCK_SECONDS = 30;
const MAX_LOCK_SECONDS = 300;
const FREE_TO_TRY = { canAttempt: true, retryAfterSeconds: 0 };

function setup() {
  const clock = createFakeClock();
  const throttle = createLoginThrottle({ now: clock.now });
  const fail = (email = EMAIL, times = 1) => {
    for (let i = 0; i < times; i++) throttle.recordFailure(email);
  };
  const lockOut = (email = EMAIL) => fail(email, FAILURES_BEFORE_LOCK);
  return { clock, throttle, fail, lockOut };
}

/** Falha de novo logo que cada bloqueio termina e devolve as esperas observadas. */
function collectWaits(rounds: number): number[] {
  const { throttle, clock, lockOut } = setup();
  const waits: number[] = [];
  lockOut();
  for (let i = 0; i < rounds; i++) {
    const { retryAfterSeconds } = throttle.check(EMAIL);
    waits.push(retryAfterSeconds);
    clock.advanceSeconds(retryAfterSeconds);
    throttle.recordFailure(EMAIL);
  }
  return waits;
}

describe("G10 — throttle de tentativas", () => {
  it("sem falhas → pode tentar", () => {
    const { throttle } = setup();
    expect(throttle.check(EMAIL)).toEqual(FREE_TO_TRY);
  });

  it("4 falhas seguidas → ainda permite tentar", () => {
    const { throttle, fail } = setup();
    fail(EMAIL, FAILURES_BEFORE_LOCK - 1);
    expect(throttle.check(EMAIL).canAttempt).toBe(true);
  });

  it("a 5ª falha bloqueia por 30s", () => {
    const { throttle, lockOut } = setup();
    lockOut();
    expect(throttle.check(EMAIL)).toEqual({
      canAttempt: false,
      retryAfterSeconds: FIRST_LOCK_SECONDS,
    });
  });

  it("falhas seguintes dobram a espera até o máximo de 300s", () => {
    expect(collectWaits(6)).toEqual([30, 60, 120, 240, MAX_LOCK_SECONDS, MAX_LOCK_SECONDS]);
  });

  it("durante o bloqueio informa os segundos restantes (arredondados p/ cima)", () => {
    const { throttle, clock, lockOut } = setup();
    lockOut();

    clock.advance(10.5 * SECOND); // faltam 19,5s → aparece 20

    expect(throttle.check(EMAIL)).toEqual({ canAttempt: false, retryAfterSeconds: 20 });
  });

  it("passado o tempo (relógio injetado) → libera", () => {
    const { throttle, clock, lockOut } = setup();
    lockOut();

    clock.advanceSeconds(FIRST_LOCK_SECONDS - 1);
    expect(throttle.check(EMAIL).canAttempt).toBe(false);

    clock.advanceSeconds(1);
    expect(throttle.check(EMAIL).canAttempt).toBe(true);
  });

  it("sucesso zera o contador", () => {
    const { throttle, fail } = setup();
    fail(EMAIL, FAILURES_BEFORE_LOCK - 1);
    throttle.recordSuccess(EMAIL);
    fail(EMAIL, FAILURES_BEFORE_LOCK - 1);
    expect(throttle.check(EMAIL).canAttempt).toBe(true);
  });

  it("o contador é por e-mail normalizado", () => {
    const { throttle, fail } = setup();
    fail("  A@B.com ", 3); // as 5 falhas se somam, mesmo com
    fail("a@b.com", 2); //    espaços e maiúsculas diferentes

    expect(throttle.check("a@b.COM").canAttempt).toBe(false);
    expect(throttle.check("outro@b.com")).toEqual(FREE_TO_TRY);
  });

  it("o estado fica só em memória, sem escrita em storage", () => {
    const { throttle, fail } = setup();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    fail(EMAIL, FAILURES_BEFORE_LOCK + 1);
    throttle.recordSuccess(EMAIL);

    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("instâncias são independentes", () => {
    const a = setup();
    const b = setup();
    a.lockOut();
    expect(b.throttle.check(EMAIL).canAttempt).toBe(true);
  });
});

