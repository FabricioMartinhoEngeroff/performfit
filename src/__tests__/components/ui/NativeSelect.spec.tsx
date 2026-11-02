import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NativeSelect } from "../../../components/ui/NativeSelect";

const options = [
  { label: "Opção A", value: "a" },
  { label: "Opção B", value: "b" },
  { label: "Opção C", value: "c" },
];

describe("NativeSelect — Select nativo estilizado", () => {
  it("renderiza todas as opções", () => {
    render(<NativeSelect value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText("Opção A")).toBeInTheDocument();
    expect(screen.getByText("Opção B")).toBeInTheDocument();
    expect(screen.getByText("Opção C")).toBeInTheDocument();
  });

  it("renderiza label quando fornecido", () => {
    render(<NativeSelect label="Período" value="a" onChange={() => {}} options={options} />);
    expect(screen.getByText("Período")).toBeInTheDocument();
  });

  it("não renderiza label quando não fornecido", () => {
    const { container } = render(
      <NativeSelect value="a" onChange={() => {}} options={options} />
    );
    expect(container.querySelector("label")).toBeNull();
  });

  it("chama onChange com o novo valor ao selecionar", () => {
    const onChange = vi.fn();
    render(<NativeSelect value="a" onChange={onChange} options={options} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("seleciona o valor correto passado via prop", () => {
    render(<NativeSelect value="b" onChange={() => {}} options={options} />);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("b");
  });

  it("desabilita o select quando disabled=true", () => {
    render(<NativeSelect value="a" onChange={() => {}} options={options} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});
