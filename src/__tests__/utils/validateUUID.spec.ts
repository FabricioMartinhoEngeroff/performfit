import { describe, it, expect } from "vitest";
import { isValidUUID } from "../../utils/validateUUID";

describe("validateUUID — Validação de formato UUID v4", () => {
  it("retorna true para UUID válido em lowercase", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("retorna true para UUID válido em uppercase", () => {
    expect(isValidUUID("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("retorna true para UUID com letras mistas", () => {
    expect(isValidUUID("550e8400-E29B-41d4-A716-446655440000")).toBe(true);
  });

  it("retorna false para string vazia", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("retorna false para UUID sem hífens", () => {
    expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
  });

  it("retorna false para UUID com segmento faltando", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716")).toBe(false);
  });

  it("retorna false para UUID com caracteres inválidos (g, z)", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
  });

  it("retorna false para texto aleatório", () => {
    expect(isValidUUID("nao-e-um-uuid")).toBe(false);
  });

  it("retorna false para UUID com espaços", () => {
    expect(isValidUUID(" 550e8400-e29b-41d4-a716-446655440000 ")).toBe(false);
  });
});
