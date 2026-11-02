
import { describe, it, expect } from "vitest";
import { MUSCLE_MAP } from "../../data/muscleMap";
import { SESSOES } from "../../data/sessionExercises";

const OS_8_GRUPOS = [
  "Peitoral",
  "Costas",
  "Ombro",
  "Quadríceps",
  "Posterior/Glúteo",
  "Panturrilha",
  "Braço",
  "Core",
] as const;

describe("MuscleMap — Cobertura exercicio -> grupo muscular", () => {

  describe("Cobertura por sessao (sessionExercises)", () => {
    it("todos os exercicios de Upper A devem ter mapeamento", () => {
      SESSOES["Upper A"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercicios de Lower A devem ter mapeamento", () => {
      SESSOES["Lower A"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercicios de Upper B devem ter mapeamento", () => {
      SESSOES["Upper B"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

    it("todos os exercicios de Lower B devem ter mapeamento", () => {
      SESSOES["Lower B"].forEach((ex) => {
        expect(MUSCLE_MAP[ex.nome], `Sem mapeamento: "${ex.nome}"`).toBeDefined();
      });
    });

  });

  describe("Cobertura total (sem gaps)", () => {
    it("nenhum exercicio das sessoes deve ficar fora do VolumeLoad", () => {
      const semMapa = Object.values(SESSOES)
        .flat()
        .filter((ex) => !MUSCLE_MAP[ex.nome])
        .map((ex) => ex.nome);

      expect(
        semMapa,
        `Exercicios sem mapa muscular: ${semMapa.join(", ")}`
      ).toHaveLength(0);
    });
  });

  describe("Os 8 grupos musculares estao presentes no mapa", () => {
    const valores = Object.values(MUSCLE_MAP);

    OS_8_GRUPOS.forEach((grupo) => {
      it(`deve conter o grupo "${grupo}"`, () => {
        expect(valores).toContain(grupo);
      });
    });

    it("todos os valores do mapa pertencem a um dos 8 grupos", () => {
      const fora = [...new Set(valores)].filter(
        (v) => !(OS_8_GRUPOS as readonly string[]).includes(v)
      );
      expect(fora, `Grupos nao reconhecidos: ${fora.join(", ")}`).toHaveLength(0);
    });
  });

  describe("Mapeamentos criticos", () => {
    it("Supino reto barra -> Peitoral", () => {
      expect(MUSCLE_MAP["Supino reto barra"]).toBe("Peitoral");
    });

    it("Barra fixa -> Costas", () => {
      expect(MUSCLE_MAP["Barra fixa"]).toBe("Costas");
    });

    it("Elevacao lateral cabo -> Ombro", () => {
      expect(MUSCLE_MAP["Elevação lateral cabo"]).toBe("Ombro");
    });

    it("Agachamento livre -> Quadriceps", () => {
      expect(MUSCLE_MAP["Agachamento livre"]).toBe("Quadríceps");
    });

    it("Stiff -> Posterior/Gluteo", () => {
      expect(MUSCLE_MAP["Stiff"]).toBe("Posterior/Glúteo");
    });

    it("Elevacao pelvica -> Posterior/Gluteo", () => {
      expect(MUSCLE_MAP["Elevação pélvica"]).toBe("Posterior/Glúteo");
    });

    it("Adutor maquina -> Posterior/Gluteo", () => {
      expect(MUSCLE_MAP["Adutor máquina"]).toBe("Posterior/Glúteo");
    });

    it("Panturrilha sentado -> Panturrilha", () => {
      expect(MUSCLE_MAP["Panturrilha sentado"]).toBe("Panturrilha");
    });

    it("Rosca scott unilateral -> Braco", () => {
      expect(MUSCLE_MAP["Rosca scott unilateral"]).toBe("Braço");
    });

    it("Triceps polia barra reta -> Braco", () => {
      expect(MUSCLE_MAP["Tríceps polia barra reta"]).toBe("Braço");
    });

    it("Abdomen cabo ajoelhado -> Core", () => {
      expect(MUSCLE_MAP["Abdômen cabo ajoelhado"]).toBe("Core");
    });
  });
});
