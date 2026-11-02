/**
 * UITest → components/ui
 * Testa os componentes de interface reutilizáveis (Input, Button).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

describe("UI — Componentes base", () => {
  describe("Input", () => {
    it("renderiza um input de texto", () => {
      render(<Input type="text" placeholder="Teste" value="" onChange={() => {}} />);
      expect(screen.getByPlaceholderText("Teste")).toBeInTheDocument();
    });

    it("chama onChange ao digitar", () => {
      const onChange = vi.fn();
      render(<Input type="text" value="" onChange={onChange} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "100" },
      });
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("exibe o valor passado via prop", () => {
      render(<Input type="text" value="42" onChange={() => {}} />);
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("42");
    });
  });

  describe("Button", () => {
    it("renderiza um botão com texto", () => {
      render(<Button onClick={() => {}}>Salvar</Button>);
      expect(screen.getByText("Salvar")).toBeInTheDocument();
    });

    it("chama onClick ao clicar", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Clique</Button>);
      fireEvent.click(screen.getByText("Clique"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("renderiza variante outline sem erros", () => {
      expect(() =>
        render(<Button variant="outline" onClick={() => {}}>Outline</Button>)
      ).not.toThrow();
    });
  });
});
