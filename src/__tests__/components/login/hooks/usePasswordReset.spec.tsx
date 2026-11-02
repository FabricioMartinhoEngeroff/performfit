import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  auth: {
    status: "anonymous",
    user: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
  },
}));
vi.mock("../../../../components/login/context/useAuth", () => ({ useAuth: () => mocks.auth }));

import {
  usePasswordReset,
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  RESET_COOLDOWN_SECONDS,
} from "../../../../components/login/hooks/usePasswordReset";
import { getAuthErrorMessage } from "../../../../components/login/domain/authErrors";
import { err, ok } from "../../../../components/login/domain/result";
import { deferred } from "../helpers/deferred";
import { ANA_EMAIL, createFakeClock } from "../helpers/fixtures";
import { changeEvent, submitEvent, submitTwiceWhilePending } from "../helpers/formEvents";

const MESSY_EMAIL = "  Ana@Example.com ";

function setup() {
  const clock = createFakeClock();
  const hook = renderHook(() => usePasswordReset({ now: clock.now }));

  const typeEmail = (value: string) =>
    act(() => hook.result.current.handleChange(changeEvent("email", value)));
  const submit = async () => {
    await act(async () => {
      await hook.result.current.handleSubmit(submitEvent());
    });
  };

  const request = async (email = ANA_EMAIL) => {
    typeEmail(email);
    await submit();
  };
  return { ...hook, clock, typeEmail, submit, request };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.sendPasswordReset.mockResolvedValue(ok(undefined));
});
afterEach(() => vi.restoreAllMocks());

describe("G18 — recuperação de senha", () => {
  it("e-mail inválido → erro, sem chamada", async () => {
    const { result, request } = setup();
    await request("abc");
    expect(result.current.error).toBeTruthy();
    expect(mocks.auth.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("e-mail vazio → erro, sem chamada", async () => {
    const { result, submit } = setup();
    await submit();
    expect(result.current.error).toBeTruthy();
    expect(mocks.auth.sendPasswordReset).not.toHaveBeenCalled();
  });

  it("e-mail válido → sendPasswordReset com e-mail normalizado", async () => {
    const { request } = setup();
    await request(MESSY_EMAIL);
    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledWith(ANA_EMAIL);
  });

  it("sucesso → mensagem neutra, idêntica para e-mail existente e inexistente", async () => {
    expect(PASSWORD_RESET_NEUTRAL_MESSAGE).toBe("Se o e-mail estiver cadastrado, enviaremos um link.");

    const existing = setup();
    await existing.request("existe@example.com");
    const missing = setup();
    await missing.request("naoexiste@example.com");

    expect(existing.result.current.message).toBe(PASSWORD_RESET_NEUTRAL_MESSAGE);
    expect(missing.result.current.message).toBe(existing.result.current.message);
    expect(existing.result.current.status).toBe("sent");
  });

  it("NETWORK → mensagem de erro", async () => {
    mocks.auth.sendPasswordReset.mockResolvedValue(err("NETWORK"));
    const { result, request } = setup();

    await request();

    expect(result.current.error).toBe(getAuthErrorMessage("NETWORK"));
    expect(result.current.message).toBeNull();
  });

  it("gateway lançando → mensagem genérica, sem propagar", async () => {
    mocks.auth.sendPasswordReset.mockRejectedValue(new Error("x"));
    const { result, typeEmail, submit } = setup();
    typeEmail(ANA_EMAIL);

    await expect(submit()).resolves.toBeUndefined();

    expect(result.current.error).toBe(getAuthErrorMessage("UNKNOWN"));
  });

  it("duplo clique → uma chamada só", async () => {
    const sending = deferred<ReturnType<typeof ok>>();
    mocks.auth.sendPasswordReset.mockReturnValue(sending.promise);
    const { result, typeEmail } = setup();
    typeEmail(ANA_EMAIL);

    await submitTwiceWhilePending(
      () => result.current.handleSubmit,
      () => sending.resolve(ok(undefined)),
    );

    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledTimes(1);
  });

  it("reenvio só após cooldown de 60s", async () => {
    expect(RESET_COOLDOWN_SECONDS).toBe(60);
    const { result, clock, request, submit } = setup();
    await request();
    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledTimes(1);

    clock.advanceSeconds(RESET_COOLDOWN_SECONDS - 1);
    await submit();
    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledTimes(1);
    expect(result.current.cooldownRemaining).toBeGreaterThan(0);

    clock.advanceSeconds(1);
    await submit();
    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledTimes(2);
  });

  it("falha de rede não consome o cooldown", async () => {
    mocks.auth.sendPasswordReset.mockResolvedValueOnce(err("NETWORK"));
    const { request, submit } = setup();

    await request();
    await submit();

    expect(mocks.auth.sendPasswordReset).toHaveBeenCalledTimes(2);
  });
});