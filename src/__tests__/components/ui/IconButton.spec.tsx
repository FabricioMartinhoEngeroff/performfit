import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IconButton } from "../../../components/ui/IconButton";

describe("IconButton — Botão de ícone", () => {
  it("renderiza o ícone passado", () => {
    render(
      <IconButton icon={<span data-testid="icon">X</span>} onClick={() => {}} />
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("chama onClick ao clicar", () => {
    const onClick = vi.fn();
    render(
      <IconButton icon={<span>X</span>} onClick={onClick} />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renderiza title quando fornecido", () => {
    render(
      <IconButton icon={<span>X</span>} onClick={() => {}} title="Excluir" />
    );
    expect(screen.getByTitle("Excluir")).toBeInTheDocument();
  });

  it("renderiza como button element", () => {
    render(
      <IconButton icon={<span>X</span>} onClick={() => {}} />
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
