import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DatePicker } from "../../../components/ui/DatePicker";

describe("DatePicker", () => {
  it("renderiza o label padrao 'Data'", () => {
    render(<DatePicker selected={null} onChange={() => {}} />);
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("renderiza label customizado", () => {
    render(<DatePicker selected={null} onChange={() => {}} label="Início" />);
    expect(screen.getByText("Início")).toBeInTheDocument();
  });

  it("exibe placeholder quando nenhuma data esta selecionada", () => {
    render(<DatePicker selected={null} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Selecione a data")).toBeInTheDocument();
  });

  it("exibe a data selecionada formatada", () => {
    const date = new Date(2026, 7, 4); // 04/08/2026
    render(<DatePicker selected={date} onChange={() => {}} />);
    const input = screen.getByDisplayValue("04/08/2026");
    expect(input).toBeInTheDocument();
  });

  it("input e readonly para evitar digitacao", () => {
    render(<DatePicker selected={null} onChange={() => {}} />);
    const input = screen.getByPlaceholderText("Selecione a data");
    expect(input).toHaveAttribute("readonly");
  });
});
