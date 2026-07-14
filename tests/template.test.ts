import { describe, it, expect } from "vitest";
import { resolveTemplate, findUnknownVariables, cleanupResolvedText } from "@/lib/services/template";

describe("resolveTemplate", () => {
  it("substitui variáveis preenchidas", () => {
    const out = resolveTemplate(
      "Olá, meu nome é {{nome}}. Vim do site {{parceiro}}. Código: {{click_id}}",
      { nome: "Alex", parceiro: "Parceiro X", click_id: "CK72DA" },
    );
    expect(out).toBe("Olá, meu nome é Alex. Vim do site Parceiro X. Código: CK72DA");
  });

  it("remove variáveis vazias sem deixar pontuação/espaços quebrados", () => {
    const out = resolveTemplate(
      "Olá, meu nome é {{nome}}. Vim do site {{parceiro}} e quero falar. Código: {{click_id}}",
      { nome: null, parceiro: "Parceiro X", click_id: null },
    );
    expect(out).not.toContain("{{");
    expect(out).not.toMatch(/\s{2,}/);
    expect(out).not.toMatch(/\s\./);
    expect(out).toContain("Parceiro X");
  });

  it("não deixa 'é .' quando nome é vazio", () => {
    const out = resolveTemplate("meu nome é {{nome}}.", {});
    expect(out).not.toContain("é .");
    expect(out).not.toContain("é.");
  });

  it("aplica cleanup em pontuação duplicada", () => {
    expect(cleanupResolvedText("Olá, . Fim")).toBe("Olá. Fim");
  });
});

describe("findUnknownVariables", () => {
  it("detecta variáveis desconhecidas", () => {
    expect(findUnknownVariables("Oi {{nome}} {{foo}} {{bar}}")).toEqual(["foo", "bar"]);
  });
  it("aceita variáveis conhecidas", () => {
    expect(findUnknownVariables("{{nome}} {{utm_source}}")).toEqual([]);
  });
});
