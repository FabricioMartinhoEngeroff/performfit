import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBreakpoint } from "../../hooks/useBreakpoint";

describe("useBreakpoint — Hook de responsive design", () => {
  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 768, writable: true });
  });

  it("retorna false quando tela é maior que breakpoint padrão (768)", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });
    Object.defineProperty(window, "innerHeight", { value: 900 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(false);
  });

  it("retorna true quando menor dimensão é menor que breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 500 });
    Object.defineProperty(window, "innerHeight", { value: 800 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(true);
  });

  it("usa breakpoint customizado", () => {
    Object.defineProperty(window, "innerWidth", { value: 500 });
    Object.defineProperty(window, "innerHeight", { value: 800 });
    const { result } = renderHook(() => useBreakpoint(400));
    expect(result.current).toBe(false);
  });

  it("retorna true quando innerHeight é menor que breakpoint", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });
    Object.defineProperty(window, "innerHeight", { value: 600 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(true);
  });

  it("atualiza ao disparar evento resize", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });
    Object.defineProperty(window, "innerHeight", { value: 900 });
    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 500 });
      Object.defineProperty(window, "innerHeight", { value: 900 });
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });

  it("remove event listeners ao desmontar", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useBreakpoint());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("orientationchange", expect.any(Function));
    removeSpy.mockRestore();
  });
});
