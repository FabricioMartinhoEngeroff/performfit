import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormField } from "../../../components/ui/FormField";
import { FaUser } from "react-icons/fa";

describe("FormField — Campo de formulário com ícone", () => {
  const defaultProps = {
    id: "name",
    icon: FaUser,
    type: "text",
    placeholder: "Digite seu nome",
    name: "name",
    value: "",
    onChange: vi.fn(),
  };

  it("renderiza o input com placeholder", () => {
    render(<FormField {...defaultProps} />);
    expect(screen.getByPlaceholderText("Digite seu nome")).toBeInTheDocument();
  });

  it("renderiza o label quando fornecido", () => {
    render(<FormField {...defaultProps} label="Nome completo" />);
    expect(screen.getByText("Nome completo")).toBeInTheDocument();
  });

  it("não renderiza label quando não fornecido", () => {
    const { container } = render(<FormField {...defaultProps} />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("exibe mensagem de erro quando error é passado", () => {
    render(<FormField {...defaultProps} error="Campo obrigatório" />);
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });

  it("não exibe mensagem de erro quando error é null", () => {
    render(<FormField {...defaultProps} error={null} />);
    expect(screen.queryByText("Campo obrigatório")).toBeNull();
  });

  it("chama onChange ao digitar", () => {
    const onChange = vi.fn();
    render(<FormField {...defaultProps} onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), {
      target: { value: "João" },
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("exibe o valor passado via prop", () => {
    render(<FormField {...defaultProps} value="Maria" />);
    expect(
      (screen.getByPlaceholderText("Digite seu nome") as HTMLInputElement).value
    ).toBe("Maria");
  });

  it("renderiza botão de toggle de senha para isPasswordField", () => {
    render(
      <FormField
        {...defaultProps}
        type="password"
        isPasswordField
        placeholder="Senha"
      />
    );
    const input = screen.getByPlaceholderText("Senha") as HTMLInputElement;
    expect(input.type).toBe("password");
  });
});
