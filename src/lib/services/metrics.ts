// Cálculo puro de métricas do dashboard. Regras centralizadas e documentadas.

export const UNIQUE_CLICK_WINDOW_HOURS = 24;

export interface MetricInputs {
  impressions: number;
  totalClicks: number; // link_clicked (não teste)
  uniqueClicks: number; // sessão única por link em 24h
  leads: number; // lead_submitted
  whatsappRedirects: number; // whatsapp_redirected
  externalRedirects: number; // external_redirected
  conversions: number; // conversion_registered
}

export interface MetricRates {
  ctr: number | null; // cliques únicos ÷ impressões
  captureRate: number | null; // leads ÷ cliques únicos
  whatsappRate: number | null; // whatsapp_redirected ÷ cliques únicos
  conversionRate: number | null; // conversões ÷ cliques únicos
}

function ratio(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return numerator / denominator;
}

/** CTR só é calculado quando houver impressões. */
export function computeRates(m: MetricInputs): MetricRates {
  return {
    ctr: ratio(m.uniqueClicks, m.impressions),
    captureRate: ratio(m.leads, m.uniqueClicks),
    whatsappRate: ratio(m.whatsappRedirects, m.uniqueClicks),
    conversionRate: ratio(m.conversions, m.uniqueClicks),
  };
}

/**
 * Conta cliques únicos: uma sessão única por link dentro da janela de 24h.
 * Recebe cliques ordenados arbitrariamente com {session_id, clicked_at}.
 */
export function countUniqueClicks(
  clicks: Array<{ session_id: string | null; clicked_at: string }>,
  windowHours = UNIQUE_CLICK_WINDOW_HOURS,
): number {
  const windowMs = windowHours * 3600 * 1000;
  const lastSeen = new Map<string, number>();
  let unique = 0;
  const sorted = [...clicks].sort(
    (a, b) => new Date(a.clicked_at).getTime() - new Date(b.clicked_at).getTime(),
  );
  for (const c of sorted) {
    const key = c.session_id ?? "anon";
    const t = new Date(c.clicked_at).getTime();
    const prev = lastSeen.get(key);
    if (prev === undefined || t - prev > windowMs) {
      unique++;
      lastSeen.set(key, t);
    }
  }
  return unique;
}

export function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}
