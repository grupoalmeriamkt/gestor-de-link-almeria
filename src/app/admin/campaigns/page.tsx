import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { Badge } from "@/components/ui/primitives";
import { SimpleCreateForm } from "@/components/simple-create-form";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await requireProfile();
  const db = await createServerSupabase();
  const [{ data: campaigns }, { data: partners }] = await Promise.all([
    db.from("campaigns").select("*, partner:partners(name)").order("created_at", { ascending: false }),
    db.from("partners").select("id, name").eq("status", "active").order("name"),
  ]);
  const rows = campaigns ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Campanhas</h1>
        <SimpleCreateForm
          endpoint="/api/admin/campaigns"
          title="Nova campanha"
          fields={[
            { name: "partner_id", label: "Parceiro", type: "select", required: true, options: (partners ?? []).map((p) => ({ value: p.id, label: p.name })) },
            { name: "name", label: "Nome", required: true },
            { name: "objective", label: "Objetivo" },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">Nenhuma campanha ainda.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="p-3">Nome</th><th className="p-3">Parceiro</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{(c.partner as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="p-3"><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
