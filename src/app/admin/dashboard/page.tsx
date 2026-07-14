import { requireProfile } from "@/lib/server/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/server/analytics";
import { formatRate } from "@/lib/services/metrics";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";
import { ClicksLineChart, DeviceBarChart } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ test?: string }>;
}) {
  await requireProfile();
  const { test } = await searchParams;
  const includeTest = test === "1";

  const db = await createServerSupabase();
  const d = await getDashboardData(db, { includeTest });

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">
          {includeTest ? "Incluindo dados de teste" : "Dados de teste excluídos"}
        </p>
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
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
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
