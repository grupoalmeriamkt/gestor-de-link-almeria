import { describe, it, expect } from "vitest";
import { validateSlug, slugify, RESERVED_SLUGS } from "@/lib/services/slug";

describe("validateSlug", () => {
  it("aceita slug válido", () => {
    expect(validateSlug("concierge").valid).toBe(true);
    expect(validateSlug("meu-link-2026").valid).toBe(true);
  });
  it("rejeita maiúsculas", () => {
    expect(validateSlug("Concierge").valid).toBe(false);
  });
  it("rejeita espaços", () => {
    expect(validateSlug("meu link").valid).toBe(false);
  });
  it("rejeita curto demais", () => {
    expect(validateSlug("ab").valid).toBe(false);
  });
  it("rejeita reservados", () => {
    for (const s of RESERVED_SLUGS) expect(validateSlug(s).valid).toBe(false);
  });
  it("rejeita hífen nas pontas", () => {
    expect(validateSlug("-abc").valid).toBe(false);
    expect(validateSlug("abc-").valid).toBe(false);
  });
});

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Concierge Julho 2026")).toBe("concierge-julho-2026");
    expect(slugify("Ação Especial")).toBe("acao-especial");
  });
});
