import { describe, it, expect } from "vitest";
import { computeRates, countUniqueClicks } from "@/lib/services/metrics";
import { generateClickCode } from "@/lib/services/click-code";
import { checkAvailability } from "@/lib/services/availability";

describe("computeRates", () => {
  it("CTR só existe com impressões", () => {
    const r = computeRates({ impressions: 0, totalClicks: 10, uniqueClicks: 8, leads: 4, whatsappRedirects: 3, externalRedirects: 0, conversions: 1 });
    expect(r.ctr).toBeNull();
    expect(r.captureRate).toBeCloseTo(0.5);
    expect(r.whatsappRate).toBeCloseTo(0.375);
  });
  it("calcula CTR com impressões", () => {
    const r = computeRates({ impressions: 100, totalClicks: 20, uniqueClicks: 20, leads: 0, whatsappRedirects: 0, externalRedirects: 0, conversions: 0 });
    expect(r.ctr).toBeCloseTo(0.2);
  });
});

describe("countUniqueClicks", () => {
  it("conta 1 por sessão dentro de 24h", () => {
    const base = "2026-07-13T10:00:00Z";
    const later = "2026-07-13T18:00:00Z"; // <24h
    const n = countUniqueClicks([
      { session_id: "s1", clicked_at: base },
      { session_id: "s1", clicked_at: later },
    ]);
    expect(n).toBe(1);
  });
  it("conta 2 quando passa da janela", () => {
    const n = countUniqueClicks([
      { session_id: "s1", clicked_at: "2026-07-13T10:00:00Z" },
      { session_id: "s1", clicked_at: "2026-07-15T10:00:00Z" },
    ]);
    expect(n).toBe(2);
  });
});

describe("generateClickCode", () => {
  it("gera código com prefixo e tamanho esperados", () => {
    const c = generateClickCode();
    expect(c).toMatch(/^CK[A-Z2-9]{6}$/);
  });
  it("gera códigos distintos", () => {
    const set = new Set(Array.from({ length: 50 }, () => generateClickCode()));
    expect(set.size).toBeGreaterThan(45);
  });
});

describe("checkAvailability", () => {
  const now = new Date("2026-07-13T12:00:00Z");
  it("ok quando ativo e no período", () => {
    expect(checkAvailability({ status: "active", starts_at: null, ends_at: null }, now).available).toBe(true);
  });
  it("pausado indisponível", () => {
    expect(checkAvailability({ status: "paused", starts_at: null, ends_at: null }, now).reason).toBe("paused");
  });
  it("expirado indisponível", () => {
    expect(checkAvailability({ status: "active", starts_at: null, ends_at: "2026-07-01T00:00:00Z" }, now).reason).toBe("expired");
  });
  it("não iniciado indisponível", () => {
    expect(checkAvailability({ status: "active", starts_at: "2026-08-01T00:00:00Z", ends_at: null }, now).reason).toBe("not_started");
  });
});
