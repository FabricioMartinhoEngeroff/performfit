import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Register } from "../../../../components/login/ui/Register";
import { FIELD_LIMITS, SECRET_PASSWORD } from "../helpers/fixtures";
import { baseFormProps } from "../helpers/uiProps";
import {
  expectAttributes,
  expectBusy,
  expectFieldError,
  expectSecretOnlyInValueOf,
} from "../helpers/domAssertions";

type Props = ComponentProps<typeof Register>;

const REQUIREMENTS = [
  { code: "PASSWORD_TOO_SHORT", label: "Mínimo de 8 caracteres", met: false },
  { code: "PASSWORD_NO_UPPERCASE", label: "Uma letra maiúscula", met: false },
  { code: "PASSWORD_NO_LOWERCASE", label: "Uma letra minúscula", met: true },
  { code: "PASSWORD_NO_NUMBER", label: "Um número", met: false },
  { code: "PASSWORD_NO_SPECIAL", label: "Um caractere especial", met: false },
];
const FORBIDDEN_FIELDS = /nome|cpf|telefone|endere|rua|bairro|cidade|estado|cep/i;
const EXPECTED_INPUT_COUNT = 3;

function props(overrides: Partial<Props> = {}): Props {
  return {
    ...baseFormProps(),
    formData: { email: "", password: "", confirmPassword: "" },
    requirements: REQUIREMENTS,
    onToggleLogin: vi.fn(),
    ...overrides,
  } as Props;
}

const emailInput = () => screen.getByLabelText(/e-mail/i) as HTMLInputElement;
const passwordInput = () => screen.getByLabelText(/^senha$/i) as HTMLInputElement;
const confirmInput = () => screen.getByLabelText(/confirmar senha/i) as HTMLInputElement;
const requirementItem = (label: string) => screen.getByText(label).closest("li")!;

describe("G16 — Register: campos e atributos", () => {
  it("autocomplete: e-mail=email, senha e confirmação=new-password", () => {
    render(<Register {...props()} />);
    expectAttributes(emailInput(), { autocomplete: "email" });
    expectAttributes(passwordInput(), { autocomplete: "new-password" });
    expectAttributes(confirmInput(), { autocomplete: "new-password" });
  });

  it("limites: e-mail 254, senha e confirmação 128", () => {
    render(<Register {...props()} />);
    expectAttributes(emailInput(), { maxlength: String(FIELD_LIMITS.email) });
    expectAttributes(passwordInput(), { maxlength: String(FIELD_LIMITS.password) });
    expectAttributes(confirmInput(), { maxlength: String(FIELD_LIMITS.password) });
  });

  it("só e-mail, senha e confirmação: sem nome, CPF, telefone nem endereço", () => {
    const { container } = render(<Register {...props()} />);
    expect(screen.queryByLabelText(FORBIDDEN_FIELDS)).toBeNull();
    expect(container.querySelectorAll("input")).toHaveLength(EXPECTED_INPUT_COUNT);
  });
});

describe("G16 — Register: requisitos e visibilidade", () => {
  it("lista os requisitos da senha e distingue atendidos de pendentes", () => {
    render(<Register {...props()} />);
    for (const requirement of REQUIREMENTS) {
      expect(screen.getByText(requirement.label)).toBeInTheDocument();
    }
    const met = requirementItem("Uma letra minúscula");
    const unmet = requirementItem("Um número");

    expect(met.textContent).not.toBe(unmet.textContent); // ícone/estado textual diferente
    expect(met).toHaveAttribute("data-met", "true");
    expect(unmet).toHaveAttribute("data-met", "false");
  });

  it("o checklist reflete novas props (atualiza ao digitar)", () => {
    const { rerender } = render(<Register {...props()} />);

    rerender(
      <Register {...props({ requirements: REQUIREMENTS.map((r) => ({ ...r, met: true })) })} />,
    );

    expect(requirementItem("Um número")).toHaveAttribute("data-met", "true");
  });

  it("o toggle de visibilidade vale para senha e confirmação", () => {
    render(<Register {...props({ passwordVisible: true })} />);
    expect(passwordInput()).toHaveAttribute("type", "text");
    expect(confirmInput()).toHaveAttribute("type", "text");
    expect(screen.getAllByRole("button", { name: "Ocultar senha" })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("senha oculta por padrão nos dois campos", () => {
    render(<Register {...props()} />);
    expect(passwordInput()).toHaveAttribute("type", "password");
    expect(confirmInput()).toHaveAttribute("type", "password");
  });
});

describe("G16 — Register: erros, loading e submit", () => {
  it("erro de campo com aria-invalid e aria-describedby", () => {
    render(<Register {...props({ errors: { confirmPassword: "As senhas não conferem." } })} />);
    expectFieldError(confirmInput(), "As senhas não conferem.");
  });

  it("erro geral com role=alert", () => {
    render(<Register {...props({ formError: "Sem conexão." })} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Sem conexão.");
  });

  it("loading → botão disabled e aria-busy", () => {
    render(<Register {...props({ loading: true })} />);
    expectBusy(screen.getByRole("button", { name: /cadastr/i }));
  });

  it("o botão de envio é type=submit", () => {
    render(<Register {...props()} />);
    expect(screen.getByRole("button", { name: /^(criar conta|cadastrar)/i })).toHaveAttribute(
      "type",
      "submit",
    );
  });

  it("Enter em um campo envia o formulário", async () => {
    const p = props();
    render(<Register {...p} />);
    await userEvent.type(emailInput(), "{enter}");
    expect(p.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("após submit inválido o foco vai para o primeiro campo inválido", () => {
    const { rerender } = render(<Register {...props()} />);

    rerender(<Register {...props({ submitCount: 1, errors: { email: "x", confirmPassword: "y" } })} />);

    expect(emailInput()).toHaveFocus();
  });

  it("'Já tenho conta' é botão que chama onToggleLogin", async () => {
    const p = props();
    render(<Register {...p} />);
    const button = screen.getByRole("button", { name: /já tenho conta/i });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("href");

    await userEvent.click(button);

    expect(p.onToggleLogin).toHaveBeenCalledTimes(1);
  });

  it("não há <a href='#'> na tela", () => {
    const { container } = render(<Register {...props()} />);
    expect(container.querySelector('a[href="#"]')).toBeNull();
  });

  it("as senhas só aparecem no value dos inputs", () => {
    const { container } = render(
      <Register
        {...props({
          formData: {
            email: "a@b.com",
            password: SECRET_PASSWORD,
            confirmPassword: SECRET_PASSWORD,
          },
        })}
      />,
    );

    expectSecretOnlyInValueOf(container, SECRET_PASSWORD, [passwordInput(), confirmInput()]);
  });
});