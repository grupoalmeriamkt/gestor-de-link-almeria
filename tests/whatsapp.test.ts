import { describe, it, expect } from "vitest";
import {
  normalizeWhatsappNumber,
  isValidWhatsappNumber,
  formatWhatsappNumber,
  buildWhatsappUrl,
} from "@/lib/services/whatsapp";

describe("normalizeWhatsappNumber", () => {
  it("remove tudo que não é dígito", () => {
    expect(normalizeWhatsappNumber("+55 (61) 99999-9999")).toBe("5561999999999");
  });
});

describe("isValidWhatsappNumber", () => {
  it("aceita número BR válido", () => {
    expect(isValidWhatsappNumber("5561999999999")).toBe(true);
  });
  it("rejeita curto demais", () => {
    expect(isValidWhatsappNumber("123")).toBe(false);
  });
  it("rejeita repetição trivial", () => {
    expect(isValidWhatsappNumber("0000000000000")).toBe(false);
  });
});

describe("formatWhatsappNumber", () => {
  it("formata número BR", () => {
    expect(formatWhatsappNumber("5561999999999")).toBe("+55 (61) 99999-9999");
  });
});

describe("buildWhatsappUrl", () => {
  it("gera URL wa.me com mensagem codificada", () => {
    const url = buildWhatsappUrl("5561999999999", "Olá {{nome}}", { nome: "Alex" });
    expect(url).toBe("https://wa.me/5561999999999?text=Ol%C3%A1%20Alex");
  });
  it("normaliza o número na URL", () => {
    const url = buildWhatsappUrl("+55 (61) 99999-9999", "oi", {});
    expect(url).toContain("wa.me/5561999999999");
  });
});
