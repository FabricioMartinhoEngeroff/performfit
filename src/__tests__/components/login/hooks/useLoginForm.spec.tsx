import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  auth: {
    status: "anonymous",
    user: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => mocks.navigate,
}));
vi.mock("../../../../components/login/context/useAuth", () => ({ useAuth: () => mocks.auth }));

import { useLoginForm } from "../../../../components/login/hooks/useLoginForm";
import { createLoginThrottle } from "../../../../components/login/security/loginThrottle";
import { getAuthErrorMessage } from "../../../../components/login/domain/authErrors";
import { err, ok } from "../../../../components/login/domain/result";
import { ANA } from "../helpers/fakeGateway";
import { deferred } from "../helpers/deferred";
import {
  ANA_EMAIL,
  FAILURES_BEFORE_LOCK,
  FIRST_LOCK_SECONDS,
  createFakeClock,
} from "../helpers/fixtures";
import { changeEvent, startSubmit, submitEvent, submitTwiceWhilePending } from "../helpers/formEvents";
import { expectNeverLogged, silenceConsole } from "../helpers/consoleSpies";

const PASSWORD = "S3nh@Secreta!"; 
const MESSY_EMAIL = "  Ana@Example.com ";
const HOME = "/app";
const REPLACE = { replace: true };

type Context = ReturnType<typeof setup>;

function setup(from?: unknown) {
  const clock = createFakeClock();
  const throttle = createLoginThrottle({ now: clock.now });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[{ pathname: "/", state: from ? { from } : null }]}>
      {children}
    </MemoryRouter>
  );
  const hook = renderHook(() => useLoginForm({ throttle }), { wrapper });

  const fill = (email = MESSY_EMAIL, password = PASSWORD) => {
    act(() => hook.result.current.handleChange(changeEvent("email", email)));
    act(() => hook.result.current.handleChange(changeEvent("password", password)));
  };
  const submit = async () => {
    await act(async () => {
      await hook.result.current.handleSubmit(submitEvent());
    });
  };
  /** Preenche e envia, como uma pessoa tentando entrar. */
  const attempt = async (email = ANA_EMAIL, password = PASSWORD) => {
    fill(email, password);
    await submit();
  };
  return { ...hook, clock, throttle, fill, submit, attempt };
}

/** Falha `times` vezes seguidas (deixa o gateway respondendo INVALID_CREDENTIALS). */
async function failTimes(ctx: Context, times: number) {
  mocks.auth.signIn.mockResolvedValue(err("INVALID_CREDENTIALS"));
  for (let i = 0; i < times; i++) await ctx.attempt();
}

const signInCalls = () => mocks.auth.signIn.mock.calls.length;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.signIn.mockResolvedValue(ok(ANA));
});
afterEach(() => vi.restoreAllMocks());

describe("G13 — useLoginForm: estado e validação", () => {
  it("estado inicial: vazio, sem erros, loading=false, senha oculta", () => {
    const { result } = setup();
    expect(result.current.formData).toEqual({ email: "", password: "" });
    expect(result.current.errors).toEqual({});
    expect(result.current.formError).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.passwordVisible).toBe(false);
  });

  it("handleChange atualiza o campo", () => {
    const { result } = setup();
    act(() => result.current.handleChange(changeEvent("email", "x")));
    expect(result.current.formData.email).toBe("x");
  });

  it("erro de campo só aparece depois de blur ou submit", () => {
    const { result } = setup();
    act(() => result.current.handleChange(changeEvent("email", "abc")));
    expect(result.current.errors.email).toBeUndefined();

    act(() => result.current.handleBlur(changeEvent("email", "abc")));

    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.password).toBeUndefined();
  });

  it("submit vazio → marca touched, mostra erros e não chama o gateway", async () => {
    const { result, submit } = setup();
    await submit();
    expect(mocks.auth.signIn).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.password).toBeTruthy();
  });

  it("e-mail inválido → erro, sem chamada", async () => {
    const { attempt, result } = setup();
    await attempt("abc");
    expect(result.current.errors.email).toBeTruthy();
    expect(mocks.auth.signIn).not.toHaveBeenCalled();
  });

  it("preventDefault é chamado no submit", async () => {
    const { result } = setup();
    const event = submitEvent();
    await act(async () => {
      await result.current.handleSubmit(event);
    });
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("o toggle de visibilidade alterna e não persiste", () => {
    const { result } = setup();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    act(() => result.current.togglePasswordVisibility());
    expect(result.current.passwordVisible).toBe(true);
    act(() => result.current.togglePasswordVisibility());
    expect(result.current.passwordVisible).toBe(false);

    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("G13 — useLoginForm: envio", () => {
  it("válido → signIn uma vez, e-mail normalizado e senha intacta", async () => {
    const { attempt } = setup();
    const paddedPassword = ` ${PASSWORD} `;

    await attempt(MESSY_EMAIL, paddedPassword);

    expect(mocks.auth.signIn).toHaveBeenCalledTimes(1);
    expect(mocks.auth.signIn).toHaveBeenCalledWith({ email: ANA_EMAIL, password: paddedPassword });
  });

  it("loading fica true durante a requisição e volta a false", async () => {
    const signIn = deferred<ReturnType<typeof ok>>();
    mocks.auth.signIn.mockReturnValue(signIn.promise);
    const { fill, result } = setup();
    fill();

    const pending = startSubmit(() => result.current.handleSubmit);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      signIn.resolve(ok(ANA));
      await pending;
    });
    expect(result.current.loading).toBe(false);
  });

  it("loading volta a false mesmo se o gateway lançar", async () => {
    mocks.auth.signIn.mockRejectedValue(new Error("boom"));
    const { attempt, result } = setup();

    await attempt();

    expect(result.current.loading).toBe(false);
    expect(result.current.formError).toBe(getAuthErrorMessage("UNKNOWN"));
  });

  it("duplo submit durante loading → uma chamada só", async () => {
    const signIn = deferred<ReturnType<typeof ok>>();
    mocks.auth.signIn.mockReturnValue(signIn.promise);
    const { fill, result } = setup();
    fill();

    await submitTwiceWhilePending(
      () => result.current.handleSubmit,
      () => signIn.resolve(ok(ANA)),
    );

    expect(mocks.auth.signIn).toHaveBeenCalledTimes(1);
  });

  it("sucesso → navigate('/app', {replace:true})", async () => {
    const { attempt } = setup();
    await attempt();
    expect(mocks.navigate).toHaveBeenCalledWith(HOME, REPLACE);
  });

  it("sucesso com state.from seguro → navega para ele", async () => {
    const { attempt } = setup("/graficos");
    await attempt();
    expect(mocks.navigate).toHaveBeenCalledWith("/graficos", REPLACE);
  });

  it.each(["//evil.com", "https://evil.com", "javascript:alert(1)"])(
    "state.from malicioso (%s) → /app",
    async (from) => {
      const { attempt } = setup(from);
      await attempt();
      expect(mocks.navigate).toHaveBeenCalledWith(HOME, REPLACE);
    },
  );
});

describe("G13 — useLoginForm: erros do gateway", () => {
  it("INVALID_CREDENTIALS → erro genérico, senha limpa e e-mail mantido", async () => {
    mocks.auth.signIn.mockResolvedValue(err("INVALID_CREDENTIALS"));
    const { attempt, result } = setup();

    await attempt();

    expect(result.current.formError).toBe(getAuthErrorMessage("INVALID_CREDENTIALS"));
    expect(result.current.formData.password).toBe("");
    expect(result.current.formData.email).toBe(ANA_EMAIL);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it.each(["TOO_MANY_ATTEMPTS", "NETWORK", "UNKNOWN"] as const)(
    "%s → mensagem correspondente",
    async (code) => {
      mocks.auth.signIn.mockResolvedValue(err(code));
      const { attempt, result } = setup();

      await attempt();

      expect(result.current.formError).toBe(getAuthErrorMessage(code));
    },
  );

  it("digitar de novo limpa o erro geral do formulário", async () => {
    mocks.auth.signIn.mockResolvedValue(err("INVALID_CREDENTIALS"));
    const { attempt, result } = setup();
    await attempt();
    expect(result.current.formError).not.toBeNull();

    act(() => result.current.handleChange(changeEvent("password", "x")));

    expect(result.current.formError).toBeNull();
  });

  it("nunca chama window.alert", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    mocks.auth.signIn.mockResolvedValue(err("INVALID_CREDENTIALS"));
    const { attempt } = setup();

    await attempt();
    await attempt();

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("nenhum console.* recebe argumento contendo a senha", async () => {
    const spies = silenceConsole();
    mocks.auth.signIn
      .mockResolvedValueOnce(err("INVALID_CREDENTIALS"))
      .mockRejectedValueOnce(new Error(`senha=${PASSWORD}`));
    const { attempt } = setup();

    await attempt();
    await attempt();

    expectNeverLogged(PASSWORD, spies);
  });

  it("a senha não vai para URL, querystring nem history.state", async () => {
    const { attempt } = setup();

    await attempt();

    expect(window.location.href).not.toContain(PASSWORD);
    expect(window.location.search).toBe("");
    expect(JSON.stringify(window.history.state)).not.toContain(PASSWORD);
    for (const call of mocks.navigate.mock.calls) {
      expect(JSON.stringify(call)).not.toContain(PASSWORD);
    }
  });
});

describe("G13 — useLoginForm: throttle e ciclo de vida", () => {
  it("5 falhas → submit bloqueado sem chamar o gateway, com mensagem de segundos", async () => {
    const ctx = setup();
    await failTimes(ctx, FAILURES_BEFORE_LOCK);
    expect(signInCalls()).toBe(FAILURES_BEFORE_LOCK);

    await ctx.attempt();

    expect(signInCalls()).toBe(FAILURES_BEFORE_LOCK);
    expect(ctx.result.current.formError).toBe(
      getAuthErrorMessage("TOO_MANY_ATTEMPTS", { retryAfterSeconds: FIRST_LOCK_SECONDS }),
    );
    expect(ctx.result.current.formError).toContain(String(FIRST_LOCK_SECONDS));
  });

  it("4 falhas ainda permitem a 5ª tentativa", async () => {
    const ctx = setup();
    await failTimes(ctx, FAILURES_BEFORE_LOCK - 1);

    await ctx.attempt();

    expect(signInCalls()).toBe(FAILURES_BEFORE_LOCK);
  });

  it("passado o tempo do bloqueio, libera a nova tentativa", async () => {
    const ctx = setup();
    await failTimes(ctx, FAILURES_BEFORE_LOCK);
    ctx.clock.advanceSeconds(FIRST_LOCK_SECONDS);
    mocks.auth.signIn.mockResolvedValue(ok(ANA));

    await ctx.attempt();

    expect(signInCalls()).toBe(FAILURES_BEFORE_LOCK + 1);
  });

  it("um sucesso zera o contador de falhas", async () => {
    const ctx = setup();
    await failTimes(ctx, FAILURES_BEFORE_LOCK);
    ctx.clock.advanceSeconds(FIRST_LOCK_SECONDS);
    mocks.auth.signIn.mockResolvedValue(ok(ANA));
    await ctx.attempt();
    expect(ctx.throttle.check(ANA_EMAIL).canAttempt).toBe(true);

    await failTimes(ctx, FAILURES_BEFORE_LOCK - 1);

    expect(ctx.throttle.check(ANA_EMAIL).canAttempt).toBe(true);
  });

  it("o bloqueio de um e-mail não afeta outro e-mail", async () => {
    const ctx = setup();
    await failTimes(ctx, FAILURES_BEFORE_LOCK);
    mocks.auth.signIn.mockResolvedValue(ok(ANA));

    await ctx.attempt("outra@example.com");

    expect(signInCalls()).toBe(FAILURES_BEFORE_LOCK + 1);
  });

  it("desmontar durante requisição pendente → sem navegar e sem avisos", async () => {
    const signIn = deferred<ReturnType<typeof ok>>();
    mocks.auth.signIn.mockReturnValue(signIn.promise);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const ctx = setup();
    ctx.fill();

    const pending = startSubmit(() => ctx.result.current.handleSubmit);
    ctx.unmount();
    await act(async () => {
      signIn.resolve(ok(ANA));
      await pending;
    });

    expect(errorSpy).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});