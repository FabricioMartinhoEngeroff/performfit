import { describe, it, expect } from "vitest";
import { safeRedirect } from "../../../../components/login/routes/safeRedirect";

const FALLBACK = "/app";

describe("G12 — safeRedirect", () => {
  it.each(["/graficos", "/relatorio", "/app", "/graficos?x=1#topo"])("%s é mantido", (p) => {
    expect(safeRedirect(p)).toBe(p);
  });

  it.each([
    "//evil.com",                   
    "https://evil.com",             
    "http://evil.com/app",          
    "javascript:alert(1)",           
    "/\\evil",                       
    "\\\\evil.com",                  
    "evil.com",                      
    "",                             
    "/app\nSet-Cookie: x=1",         
    "/\t/evil.com",                  
    " //evil.com",                   
    undefined,                      
    null,
    42,
    {},
  ])("%j → /app", (p) => {
    expect(safeRedirect(p)).toBe(FALLBACK);
  });

  it("nunca redireciona de volta para a tela de login ('/')", () => {
    expect(safeRedirect("/")).toBe(FALLBACK);
  });
});