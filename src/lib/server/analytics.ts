import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRates, type MetricInputs, type MetricRates } from "@/lib/services/metrics";

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  partnerId?: string;
  campaignId?: string;
  linkId?: string;
  includeTest?: boolean;
  includeBots?: boolean;
}

export interface DashboardData extends MetricInputs {
  rates: MetricRates;
  clicksByDay: Array<{ day: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  topLinks: Array<{ slug: string; name: string; clicks: number }>;
}

/**
 * Conta eventos por nome, aplicando filtros. Usa o cliente com sessão do usuário
 * (RLS garante que apenas staff leia).
 */
async function countEvent(
  db: SupabaseClient<any, any, any>,
  eventName: string,
  f: AnalyticsFilters,
): Promise<number> {
  let q = db.from("events").select("id", { count: "exact", head: true }).eq("event_name", eventName);
  if (!f.includeTest) q = q.eq("is_test", false);
  if (f.from) q = q.gte("created_at", f.from);
  if (f.to) q = q.lte("created_at", f.to);
  if (f.linkId) q = q.eq("tracked_link_id", f.linkId);
  const { count } = await q;
  return count ?? 0;
}

export async function getDashboardData(
  db: SupabaseClient<any, any, any>,
  f: AnalyticsFilters,
): Promise<DashboardData> {
  const [impressions, totalClicks, leads, whatsappRedirects, externalRedirects, conversions] =
    await Promise.all([
      countEvent(db, "banner_impression", f),
      countEvent(db, "link_clicked", f),
      countEvent(db, "lead_submitted", f),
      countEvent(db, "whatsapp_redirected", f),
      countEvent(db, "external_redirected", f),
      countEvent(db, "conversion_registered", f),
    ]);

  // Cliques para único/dia/dispositivo.
  let cq = db
    .from("clicks")
    .select("session_id, clicked_at, device_type, tracked_link_id")
    .order("clicked_at", { ascending: true })
    .limit(5000);
  if (!f.includeTest) cq = cq.eq("is_test", false);
  if (!f.includeBots) cq = cq.eq("is_bot", false);
  if (f.from) cq = cq.gte("clicked_at", f.from);
  if (f.to) cq = cq.lte("clicked_at", f.to);
  if (f.linkId) cq = cq.eq("tracked_link_id", f.linkId);
  const { data: clicks } = await cq;

  const rows = clicks ?? [];
  const { countUniqueClicks } = await import("@/lib/services/metrics");
  const uniqueClicks = countUniqueClicks(rows);

  const byDay = new Map<string, number>();
  const byDevice = new Map<string, number>();
  for (const c of rows) {
    const day = c.clicked_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const dev = c.device_type ?? "desktop";
    byDevice.set(dev, (byDevice.get(dev) ?? 0) + 1);
  }

  const inputs: MetricInputs = {
    impressions,
    totalClicks,
    uniqueClicks,
    leads,
    whatsappRedirects,
    externalRedirects,
    conversions,
  };

  return {
    ...inputs,
    rates: computeRates(inputs),
    clicksByDay: [...byDay.entries()].map(([day, count]) => ({ day, count })),
    deviceBreakdown: [...byDevice.entries()].map(([device, count]) => ({ device, count })),
    topLinks: [],
  };
}
