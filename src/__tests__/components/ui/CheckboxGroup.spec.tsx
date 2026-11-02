import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CheckboxGroup } from "../../../components/ui/CheckboxGroup";

const options = [
  { linhaCima: "Fase 1", linhaBaixo: "Adaptação", value: "C1" },
  { linhaCima: "Fase 2", linhaBaixo: "Força", value: "C2" },
  { linhaCima: "Fase 3", linhaBaixo: "Pico", value: "C3" },
];

describe("CheckboxGroup — Grupo de checkboxes", () => {
  it("renderiza todos os options", () => {
    render(<CheckboxGroup options={options} selected={[]} onChange={() => {}} />);
    expect(screen.getByText("Fase 1")).toBeInTheDocument();
    expect(screen.getByText("Fase 2")).toBeInTheDocument();
    expect(screen.getByText("Fase 3")).toBeInTheDocument();
  });

  it("renderiza linhas de baixo", () => {
    render(<CheckboxGroup options={options} selected={[]} onChange={() => {}} />);
    expect(screen.getByText("Adaptação")).toBeInTheDocument();
    expect(screen.getByText("Força")).toBeInTheDocument();
    expect(screen.getByText("Pico")).toBeInTheDocument();
  });

  it("marca checkbox do item selecionado", () => {
    render(<CheckboxGroup options={options} selected={["C2"]} onChange={() => {}} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  it("chama onChange com valor selecionado (modo single)", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup options={options} selected={[]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onChange).toHaveBeenCalledWith(["C1"]);
  });

  it("no modo single, substitui seleção ao clicar em outro", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup options={options} selected={["C1"]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(onChange).toHaveBeenCalledWith(["C2"]);
  });

  it("no modo single, deseleciona ao clicar no já selecionado", () => {
    const onChange = vi.fn();
    render(<CheckboxGroup options={options} selected={["C1"]} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("no modo multiple, adiciona à seleção", () => {
    const onChange = vi.fn();
    render(
      <CheckboxGroup options={options} selected={["C1"]} onChange={onChange} multiple />
    );
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(onChange).toHaveBeenCalledWith(["C1", "C2"]);
  });

  it("no modo multiple, remove da seleção ao clicar no já selecionado", () => {
    const onChange = vi.fn();
    render(
      <CheckboxGroup options={options} selected={["C1", "C2"]} onChange={onChange} multiple />
    );
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(onChange).toHaveBeenCalledWith(["C2"]);
  });
});
