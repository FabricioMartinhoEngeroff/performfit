import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button, ButtonRow, ButtonGroup } from "../../../components/ui/Button";

describe("Button", () => {
  it("renderiza o texto children", () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByText("Salvar")).toBeInTheDocument();
  });

  it("dispara onClick ao clicar", () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Clique</Button>);
    fireEvent.click(screen.getByText("Clique"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("fica desabilitado quando disabled=true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });

  it("nao dispara onClick quando desabilitado", () => {
    const handler = vi.fn();
    render(<Button disabled onClick={handler}>Disabled</Button>);
    fireEvent.click(screen.getByText("Disabled"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("renderiza com variant outline", () => {
    render(<Button variant="outline">Outline</Button>);
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });

  it("renderiza com variant danger", () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByText("Danger")).toBeInTheDocument();
  });

  it("aceita type=submit", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText("Submit")).toHaveAttribute("type", "submit");
  });
});

describe("ButtonRow", () => {
  it("renderiza children", () => {
    render(<ButtonRow><span>child</span></ButtonRow>);
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

describe("ButtonGroup", () => {
  it("renderiza children", () => {
    render(<ButtonGroup><span>group child</span></ButtonGroup>);
    expect(screen.getByText("group child")).toBeInTheDocument();
  });
});
