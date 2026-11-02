/**
 * BottomNav — 4 abas do PerformFit: Treinar, Semana, Evolução, Perfil.
 * Ícones e rótulos maiores para facilitar o toque.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BottomNav, { type Tab } from "../../../components/layout/BottomNav";

const ABAS: [Tab, string][] = [
  ["treinar", "Treinar"],
  ["semana", "Semana"],
  ["evolucao", "Evolução"],
  ["perfil", "Perfil"],
];

describe("BottomNav", () => {
  it("exibe exatamente as 4 abas", () => {
    render(<BottomNav active="treinar" onChange={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    for (const [, label] of ABAS) expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });

  it("não tem mais as abas de carga (fase 2 / GymWave)", () => {
    render(<BottomNav active="treinar" onChange={vi.fn()} />);
    for (const antiga of ["Gráficos", "Volume", "Relatórios", "Exportar", "Registrar"]) {
      expect(screen.queryByText(antiga)).not.toBeInTheDocument();
    }
  });

  it("nav tem aria-label", () => {
    render(<BottomNav active="treinar" onChange={vi.fn()} />);
    expect(screen.getByRole("navigation", { name: /navegação principal/i })).toBeInTheDocument();
  });

  it.each(ABAS)("aba %s ativa fica marcada com aria-current", (tab, label) => {
    render(<BottomNav active={tab} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
  });

  it.each(ABAS)("tocar em %s chama onChange uma vez", (tab, label) => {
    const onChange = vi.fn();
    render(<BottomNav active={tab === "treinar" ? "perfil" : "treinar"} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(tab);
  });
});
