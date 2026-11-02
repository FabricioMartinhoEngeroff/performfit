import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomSelect } from "../../../components/ui/Select";

const OPTIONS = [
  { label: "Upper A", value: "UA" },
  { label: "Lower A", value: "LA" },
];

describe("CustomSelect", () => {
  it("renderiza o placeholder padrao quando nenhum valor esta selecionado", () => {
    render(<CustomSelect options={OPTIONS} value={null} onChange={() => {}} />);
    expect(screen.getByText("Selecione...")).toBeInTheDocument();
  });

  it("renderiza placeholder customizado", () => {
    render(
      <CustomSelect
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        placeholder="Escolha um treino"
      />
    );
    expect(screen.getByText("Escolha um treino")).toBeInTheDocument();
  });

  it("exibe o valor selecionado", () => {
    render(
      <CustomSelect
        options={OPTIONS}
        value={OPTIONS[0]}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Upper A")).toBeInTheDocument();
  });

  it("renderiza label quando fornecido", () => {
    render(
      <CustomSelect
        options={OPTIONS}
        value={null}
        onChange={() => {}}
        label="Sessão"
      />
    );
    expect(screen.getByText("Sessão")).toBeInTheDocument();
  });

  it("nao renderiza label quando nao fornecido", () => {
    const { container } = render(
      <CustomSelect options={OPTIONS} value={null} onChange={() => {}} />
    );
    expect(container.querySelector("label")).toBeNull();
  });

  it("chama onChange ao interagir", () => {
    const onChange = vi.fn();
    render(
      <CustomSelect
        options={OPTIONS}
        value={OPTIONS[0]}
        onChange={onChange}
      />
    );
    expect(screen.getByText("Upper A")).toBeInTheDocument();
  });
});
