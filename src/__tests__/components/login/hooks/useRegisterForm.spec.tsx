import { describe, it, expect, vi, beforeEach, afterEach, expectTypeOf } from "vitest";
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

import { useRegisterForm } from "../../../../components/login/hooks/useRegisterForm";
import { getAuthErrorMessage } from "../../../../components/login/domain/authErrors";
import { err, ok } from "../../../../components/login/domain/result";
import { ANA } from "../helpers/fakeGateway";
import { deferred } from "../helpers/deferred";
import { ANA_EMAIL, VALID_PASSWORD } from "../helpers/fixtures";
import { changeEvent, submitEvent, submitTwiceWhilePending } from "../helpers/formEvents";
import { expectNeverLogged, silenceConsole } from "../helpers/consoleSpies";
import type { FormData } from "../../../../types/Form";

interface RegisterFields {
  email: string;
  password: string;
  confirmPassword: string;
}

const FIELDS = ["email", "password", "confirmPassword"] as const;
const MIN_REQUIREMENTS = 5;
const REPLACE = { replace: true };

const MESSY_REGISTRATION: RegisterFields = {
  email: " Ana@Example.com ",
  password: VALID_PASSWORD,
  confirmPassword: VALID_PASSWORD,
};

function setup() {
  const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
  const hook = renderHook(() => useRegisterForm(), { wrapper });

  const fill = (overrides: Partial<RegisterFields> = {}) => {
    const values = { ...MESSY_REGISTRATION, ...overrides };
    for (const [field, value] of Object.entries(values)) {
      act(() => hook.result.current.handleChange(changeEvent(field, value)));
    }
  };
  const submit = async () => {
    await act(async () => {
      await hook.result.current.handleSubmit(submitEvent());
    });
  };
  return { ...hook, fill, submit };
}

const isUnmet = (requirements: ReadonlyArray<{ code: string; met: boolean }>, code: string) =>
  !requirements.find((requirement) => requirement.code === code)!.met;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.signUp.mockResolvedValue(ok(ANA));
});
afterEach(() => vi.restoreAllMocks());

describe("G14 — useRegisterForm: validação", () => {
  it("estado inicial: 3 campos vazios (e-mail, senha e confirmação; sem nome)", () => {
    const { result } = setup();
    expect(result.current.formData).toEqual({ email: "", password: "", confirmPassword: "" });
    expect(result.current.errors).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it("submit vazio → erros em todos os campos, sem chamada", async () => {
    const { result, submit } = setup();
    await submit();
    for (const field of FIELDS) expect(result.current.errors[field], field).toBeTruthy();
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });


  it("e-mail inválido → erro", async () => {
    const { result, fill, submit } = setup();
    fill({ email: "abc" });
    await submit();
    expect(result.current.errors.email).toBeTruthy();
  });

  it("senha fraca → mostra o primeiro requisito faltante e o checklist", async () => {
    const { result, fill, submit } = setup();
    fill({ password: "abc", confirmPassword: "abc" });

    await submit();

    expect(result.current.errors.password).toBeTruthy();
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
    expect(result.current.requirements.length).toBeGreaterThanOrEqual(MIN_REQUIREMENTS);
    expect(result.current.requirements.some((requirement) => !requirement.met)).toBe(true);
  });

  it("o checklist atualiza ao digitar", () => {
    const { result, fill } = setup();

    fill({ password: "abcdefgh" });
    expect(isUnmet(result.current.requirements, "PASSWORD_NO_UPPERCASE")).toBe(true);

    fill({ password: "Abcdefgh" });
    expect(isUnmet(result.current.requirements, "PASSWORD_NO_UPPERCASE")).toBe(false);
  });

  it("confirmação diferente → erro no campo de confirmação", async () => {
    const { result, fill, submit } = setup();
    fill({ confirmPassword: "Outra123!" });
    await submit();
    expect(result.current.errors.confirmPassword).toBeTruthy();
    expect(result.current.errors.password).toBeUndefined();
  });

  it("erro só aparece depois de blur ou submit", () => {
    const { result, fill } = setup();
    fill({ email: "abc" });
    expect(result.current.errors.email).toBeUndefined();

    act(() => result.current.handleBlur(changeEvent("email", "abc")));

    expect(result.current.errors.email).toBeTruthy();
  });
});

describe("G14 — useRegisterForm: envio", () => {
  it("válido → signUp só com {email, password}: sem nome, confirmPassword nem role", async () => {
    const { fill, submit } = setup();
    fill();
    await submit();
    expect(mocks.auth.signUp).toHaveBeenCalledTimes(1);
    expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: ANA_EMAIL,
      password: VALID_PASSWORD,
    });
  });

  it("sucesso → navigate('/app', {replace:true})", async () => {
    const { fill, submit } = setup();
    fill();
    await submit();
    expect(mocks.navigate).toHaveBeenCalledWith("/app", REPLACE);
  });

  it("EMAIL_IN_USE → erro no campo e-mail", async () => {
    mocks.auth.signUp.mockResolvedValue(err("EMAIL_IN_USE"));
    const { result, fill, submit } = setup();
    fill();
    await submit();
    expect(result.current.errors.email).toBe(getAuthErrorMessage("EMAIL_IN_USE"));
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("WEAK_PASSWORD → erro no campo senha", async () => {
    mocks.auth.signUp.mockResolvedValue(err("WEAK_PASSWORD"));
    const { result, fill, submit } = setup();
    fill();
    await submit();
    expect(result.current.errors.password).toBe(getAuthErrorMessage("WEAK_PASSWORD"));
  });

  it.each(["NETWORK", "UNKNOWN"] as const)("%s → mensagem geral correspondente", async (code) => {
    mocks.auth.signUp.mockResolvedValue(err(code));
    const { result, fill, submit } = setup();
    fill();
    await submit();
    expect(result.current.formError).toBe(getAuthErrorMessage(code));
  });

  it("loading e duplo submit → uma chamada só; loading volta a false", async () => {
    const signUp = deferred<ReturnType<typeof ok>>();
    mocks.auth.signUp.mockReturnValue(signUp.promise);
    const { result, fill } = setup();
    fill();

    await submitTwiceWhilePending(
      () => result.current.handleSubmit,
      () => signUp.resolve(ok(ANA)),
    );

    expect(mocks.auth.signUp).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
  });

  it("o toggle de visibilidade vale para senha e confirmação", () => {
    const { result } = setup();
    expect(result.current.passwordVisible).toBe(false);
    act(() => result.current.togglePasswordVisibility());
    expect(result.current.passwordVisible).toBe(true);
  });

  it("sem alert e sem console com a senha", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const spies = silenceConsole();
    mocks.auth.signUp
      .mockResolvedValueOnce(err("UNKNOWN"))
      .mockRejectedValueOnce(new Error(VALID_PASSWORD));
    const { fill, submit } = setup();
    fill();

    await submit();
    await submit();

    expect(alertSpy).not.toHaveBeenCalled();
    expectNeverLogged(VALID_PASSWORD, spies);
  });
});

describe("G14 — tipo FormData (verificado só pelo tsc)", () => {
  it("não tem mais nome, cpf, telefone nem endereco", () => {
    expectTypeOf<FormData>().not.toHaveProperty("cpf");
    expectTypeOf<FormData>().not.toHaveProperty("telefone");
    expectTypeOf<FormData>().not.toHaveProperty("endereco");
    expectTypeOf<FormData>().not.toHaveProperty("name");
    expectTypeOf<FormData>().toHaveProperty("confirmPassword");
  });
});