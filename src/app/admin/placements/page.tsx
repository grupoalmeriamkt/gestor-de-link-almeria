import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { Badge } from "@/components/ui/primitives";
import { SimpleCreateForm } from "@/components/simple-create-form";

export const dynamic = "force-dynamic";

export default async function PlacementsPage() {
  await requireProfile();
  const db = await createServerSupabase();
  const [{ data: placements }, { data: campaigns }] = await Promise.all([
    db.from("placements").select("*, campaign:campaigns(name)").order("created_at", { ascending: false }),
    db.from("campaigns").select("id, name").eq("status", "active").order("name"),
  ]);
  const rows = placements ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Posicionamentos</h1>
        <SimpleCreateForm
          endpoint="/api/admin/placements"
          title="Novo posicionamento"
          fields={[
            { name: "campaign_id", label: "Campanha", type: "select", required: true, options: (campaigns ?? []).map((c) => ({ value: c.id, label: c.name })) },
            { name: "name", label: "Nome", required: true },
            { name: "partner_page", label: "Página do parceiro", type: "url" },
            { name: "position_name", label: "Posição" },
            { name: "dimensions", label: "Dimensão (ex: 1440x480)" },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">Nenhum posicionamento ainda.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="p-3">Nome</th><th className="p-3">Campanha</th><th className="p-3">Dimensão</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{(p.campaign as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="p-3">{p.dimensions ?? "—"}</td>
                  <td className="p-3"><Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
