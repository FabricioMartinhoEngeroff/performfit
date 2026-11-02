import { useState, useEffect } from "react";

export function useBreakpoint(breakpoint: number = 768) {
  const compute = () => Math.min(window.innerWidth, window.innerHeight) < breakpoint;
  const [isMobile, setIsMobile] = useState(compute());

  useEffect(() => {
    const handleResize = () => setIsMobile(compute());
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
