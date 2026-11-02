import { describe, it, expect, vi, afterEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../../../components/login/ui/Login";
import { FIELD_LIMITS, SECRET_PASSWORD } from "../helpers/fixtures";
import { baseFormProps } from "../helpers/uiProps";
import {
  expectAttributes,
  expectBusy,
  expectFieldError,
  expectSecretOnlyInValueOf,
} from "../helpers/domAssertions";

type Props = ComponentProps<typeof Login>;

function props(overrides: Partial<Props> = {}): Props {
  return {
    ...baseFormProps(),
    formData: { email: "", password: "" },
    onToggleRegister: vi.fn(),
    onForgotPassword: vi.fn(),
    ...overrides,
  } as Props;
}

const emailInput = () => screen.getByLabelText(/e-mail/i) as HTMLInputElement;
const passwordInput = () => screen.getByLabelText(/^senha$/i) as HTMLInputElement;
const enterButton = () => screen.getByRole("button", { name: /^entrar$/i });

/** Simula "o usuário enviou e o formulário voltou com erros". */
const failSubmit = (rerender: RenderResult["rerender"], errors: Props["errors"]) =>
  rerender(<Login {...props({ submitCount: 1, errors })} />);

afterEach(() => vi.restoreAllMocks());

describe("G15 — Login: estrutura e atributos", () => {
  it("renderiza título e campos com label associada", () => {
    render(<Login {...props()} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(emailInput()).toBeInTheDocument();
    expect(passwordInput()).toBeInTheDocument();
  });

  it("e-mail: type=email, autocomplete=email, maxLength=254, inputMode=email", () => {
    render(<Login {...props()} />);
    expectAttributes(emailInput(), {
      type: "email",
      autocomplete: "email",
      maxlength: String(FIELD_LIMITS.email),
      inputmode: "email",
    });
  });

  it("senha: type=password, autocomplete=current-password, maxLength=128", () => {
    render(<Login {...props()} />);
    expectAttributes(passwordInput(), {
      type: "password",
      autocomplete: "current-password",
      maxlength: String(FIELD_LIMITS.password),
    });
  });

  it("toggle: aria-label e aria-pressed alternam, e o type muda", () => {
    const { rerender } = render(<Login {...props()} />);
    const hidden = screen.getByRole("button", { name: "Mostrar senha" });
    expect(hidden).toHaveAttribute("aria-pressed", "false");
    expect(hidden).toHaveAttribute("type", "button");

    rerender(<Login {...props({ passwordVisible: true })} />);

    const shown = screen.getByRole("button", { name: "Ocultar senha" });
    expect(shown).toHaveAttribute("aria-pressed", "true");
    expect(passwordInput()).toHaveAttribute("type", "text");
  });

  it("clicar no toggle chama togglePasswordVisibility", async () => {
    const p = props();
    render(<Login {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(p.togglePasswordVisibility).toHaveBeenCalledTimes(1);
  });

  it("'Entrar' é type=submit", () => {
    render(<Login {...props()} />);
    expect(enterButton()).toHaveAttribute("type", "submit");
  });

  it("durante loading o botão fica disabled e aria-busy", () => {
    render(<Login {...props({ loading: true })} />);
    expectBusy(screen.getByRole("button", { name: /entrando|entrar/i }));
  });

  it("fora do loading o botão não tem aria-busy ativo", () => {
    render(<Login {...props()} />);
    expect(enterButton()).not.toHaveAttribute("aria-busy", "true");
  });
});

describe("G15 — Login: erros", () => {
  it("erro de campo com aria-invalid e aria-describedby apontando para a mensagem", () => {
    render(<Login {...props({ errors: { email: "E-mail inválido." } })} />);
    expectFieldError(emailInput(), "E-mail inválido.");
    expect(passwordInput()).not.toHaveAttribute("aria-invalid", "true");
  });

  it("erro geral aparece com role=alert", () => {
    render(<Login {...props({ formError: "E-mail ou senha inválidos." })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("E-mail ou senha inválidos.");
  });

  it("sem erros não há role=alert", () => {
    render(<Login {...props()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("após submit inválido o foco vai para o primeiro campo inválido", () => {
    const { rerender } = render(<Login {...props()} />);
    failSubmit(rerender, { email: "E-mail inválido.", password: "Obrigatório." });
    expect(emailInput()).toHaveFocus();
  });

  it("se só a senha é inválida, o foco vai para a senha", () => {
    const { rerender } = render(<Login {...props()} />);
    failSubmit(rerender, { password: "Obrigatório." });
    expect(passwordInput()).toHaveFocus();
  });
});

describe("G15 — Login: interação", () => {
  it("'Cadastre-se' é <button type=button> que chama onToggleRegister (sem href, sem evento global)", async () => {
    const p = props();
    const dispatch = vi.spyOn(window, "dispatchEvent");
    render(<Login {...p} />);
    const button = screen.getByRole("button", { name: /cadastre-se/i });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("href");

    await userEvent.click(button);

    expect(p.onToggleRegister).toHaveBeenCalledTimes(1);
    const globalToggles = dispatch.mock.calls.filter(([event]) => (event as Event).type === "toggleRegister");
    expect(globalToggles).toHaveLength(0);
  });

  it("não há <a href='#'> na tela", () => {
    const { container } = render(<Login {...props()} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
  });

  it("'Esqueci minha senha' abre o fluxo de recuperação", async () => {
    const p = props();
    render(<Login {...p} />);
    const trigger = screen.getByRole("button", { name: /esqueci minha senha/i });
    expect(trigger).toHaveAttribute("type", "button");

    await userEvent.click(trigger);

    expect(p.onForgotPassword).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["e-mail", emailInput],
    ["senha", passwordInput],
  ])("Enter no campo %s envia o formulário", async (_label, field) => {
    const p = props();
    render(<Login {...p} />);
    await userEvent.type(field(), "{enter}");
    expect(p.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("digitar chama handleChange e sair do campo chama handleBlur", async () => {
    const p = props();
    render(<Login {...p} />);

    await userEvent.type(emailInput(), "a");
    expect(p.handleChange).toHaveBeenCalled();

    await userEvent.tab();
    expect(p.handleBlur).toHaveBeenCalled();
  });

  it("o formulário tem noValidate (validação é do schema)", () => {
    const { container } = render(<Login {...props()} />);
    expect(container.querySelector("form")).toHaveAttribute("novalidate");
  });
});

describe("G15 — Login: a senha não vaza para o DOM", () => {
  it("o valor da senha só aparece no value do input", () => {
    const { container } = render(
      <Login {...props({ formData: { email: "a@b.com", password: SECRET_PASSWORD } })} />,
    );

    expectSecretOnlyInValueOf(container, SECRET_PASSWORD, [passwordInput()]);

    expect(passwordInput().value).toBe(SECRET_PASSWORD);
  });
});