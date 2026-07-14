import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { LeadStatusSelect, WhatsAppLink } from "./lead-row";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  await requireProfile();
  const { test } = await searchParams;
  const db = await createServerSupabase();
  let q = db
    .from("leads")
    .select("*, link:tracked_links(name, slug), click:clicks(click_code)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (test !== "1") q = q.neq("status", "test");
  const { data } = await q;
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-xs text-muted-foreground">{test === "1" ? "Incluindo testes" : "Testes ocultos"}</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">Nenhum lead ainda.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Nome</th><th className="p-3">Telefone</th><th className="p-3">Email</th><th className="p-3">Link</th><th className="p-3">Código</th><th className="p-3">Data</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3">{l.name ?? "—"}</td>
                  <td className="p-3"><WhatsAppLink phone={l.phone} /></td>
                  <td className="p-3">{l.email ?? "—"}</td>
                  <td className="p-3">{(l.link as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{(l.click as { click_code?: string } | null)?.click_code ?? "—"}</td>
                  <td className="p-3 text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3"><LeadStatusSelect id={l.id} status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
