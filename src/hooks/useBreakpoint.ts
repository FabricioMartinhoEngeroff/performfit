import { useState, useEffect } from "react";

const menorLado = () => Math.min(window.innerWidth, window.innerHeight);

/** true quando o menor lado da tela é menor que `breakpoint` (celular, em pé ou deitado). */
export function useBreakpoint(breakpoint: number = 768) {
  // Guarda só a medida da tela; a comparação é feita a cada render,
  // então trocar o breakpoint vale na hora, sem esperar um resize.
  const [lado, setLado] = useState(menorLado);

  useEffect(() => {
    const handleResize = () => setLado(menorLado());
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return lado < breakpoint;
}
