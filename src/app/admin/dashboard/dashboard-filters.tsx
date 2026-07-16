"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface CampaignOption {
  id: string;
  name: string;
  partner: string | null;
}

export function DashboardFilters({
  campaigns,
  selectedCampaign,
  includeTest,
}: {
  campaigns: CampaignOption[];
  selectedCampaign: string;
  includeTest: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Campanha</span>
        <select
          value={selectedCampaign}
          onChange={(e) => update("campaign", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Todas as campanhas</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.partner ? ` · ${c.partner}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={includeTest}
          onChange={(e) => update("test", e.target.checked ? "1" : "")}
          className="size-4"
        />
        Incluir testes
      </label>
    </div>
  );
}
