import { describe, it, expect } from "vitest";
import { isValidHttpUrl, appendUtms, deriveLinkName } from "@/lib/services/url";
import { generateShortSlug, validateSlug } from "@/lib/services/slug";

describe("isValidHttpUrl", () => {
  it("aceita http/https", () => {
    expect(isValidHttpUrl("https://a.com")).toBe(true);
    expect(isValidHttpUrl("http://a.com/x?y=1")).toBe(true);
  });
  it("rejeita inválidas e esquemas perigosos", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("ftp://a.com")).toBe(false);
    expect(isValidHttpUrl("nao-e-url")).toBe(false);
  });
});

describe("appendUtms", () => {
  it("anexa UTMs preservando query existente", () => {
    const out = appendUtms("https://a.com/p?ref=1", { utm_source: "banner", utm_campaign: "julho" });
    const u = new URL(out);
    expect(u.searchParams.get("ref")).toBe("1");
    expect(u.searchParams.get("utm_source")).toBe("banner");
    expect(u.searchParams.get("utm_campaign")).toBe("julho");
  });
  it("ignora UTMs vazias", () => {
    const out = appendUtms("https://a.com", { utm_source: "", utm_medium: null });
    expect(out).not.toContain("utm_");
  });
});

describe("deriveLinkName", () => {
  it("usa host sem www + caminho", () => {
    expect(deriveLinkName("https://www.exemplo.com/promo/verao")).toBe("exemplo.com/promo/verao");
    expect(deriveLinkName("https://exemplo.com/")).toBe("exemplo.com");
  });
});

describe("generateShortSlug", () => {
  it("gera slug válido do tamanho pedido", () => {
    for (let i = 0; i < 20; i++) {
      const s = generateShortSlug(7);
      expect(s).toHaveLength(7);
      expect(validateSlug(s).valid).toBe(true);
    }
  });
});
