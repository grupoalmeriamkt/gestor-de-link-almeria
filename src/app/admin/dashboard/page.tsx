import { requireProfile } from "@/lib/server/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/server/analytics";
import { formatRate } from "@/lib/services/metrics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";
import { ClicksLineChart, DeviceBarChart } from "@/components/charts";
import { DashboardFilters, type CampaignOption } from "./dashboard-filters";

export const dynamic = "force-dynamic";

interface CampaignRow {
  id: string;
  name: string;
  partner: { name: string } | { name: string }[] | null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string; campaign?: string }>;
}) {
  await requireProfile();
  const { test, campaign } = await searchParams;
  const includeTest = test === "1";
  const campaignId = campaign || undefined;

  const db = await createServerSupabase();

  const { data: campaignRows } = await db
    .from("campaigns")
    .select("id, name, partner:partners(name)")
    .order("name", { ascending: true });
  const campaigns: CampaignOption[] = ((campaignRows ?? []) as CampaignRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    partner: Array.isArray(c.partner) ? (c.partner[0]?.name ?? null) : (c.partner?.name ?? null),
  }));
  const selectedCampaignName = campaigns.find((c) => c.id === campaignId)?.name ?? null;

  const d = await getDashboardData(db, { includeTest, campaignId });

  const stats = [
    { label: "Impressões", value: d.impressions },
    { label: "Cliques totais", value: d.totalClicks },
    { label: "Cliques únicos", value: d.uniqueClicks },
    { label: "Leads", value: d.leads },
    { label: "WhatsApp (aberturas)", value: d.whatsappRedirects },
    { label: "Redirects externos", value: d.externalRedirects },
    { label: "Conversões", value: d.conversions },
    { label: "CTR", value: formatRate(d.rates.ctr) },
    { label: "Taxa de captura", value: formatRate(d.rates.captureRate) },
    { label: "Taxa de WhatsApp", value: formatRate(d.rates.whatsappRate) },
  ];

  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            {selectedCampaignName ? `Campanha: ${selectedCampaignName}` : "Todas as campanhas"}
            {" · "}
            {includeTest ? "incluindo dados de teste" : "dados de teste excluídos"}
          </p>
        </div>
        <DashboardFilters
          campaigns={campaigns}
          selectedCampaign={campaignId ?? ""}
          includeTest={includeTest}
        />
      </div>

      <p className="rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
        “WhatsApp (aberturas)” significa abertura/tentativa de abertura do WhatsApp — não confirma
        que a mensagem foi enviada.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 break-words text-xl font-bold sm:text-2xl">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliques por dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ClicksLineChart data={d.clicksByDay} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceBarChart data={d.deviceBreakdown} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
