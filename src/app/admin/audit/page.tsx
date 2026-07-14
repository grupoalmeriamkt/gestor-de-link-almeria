import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireRole(["admin"]);
  const db = await createServerSupabase();
  const { data } = await db
    .from("audit_logs")
    .select("*, user:profiles(email)")
    .order("created_at", { ascending: false })
    .limit(300);
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Auditoria</h1>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">Sem registros.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr><th className="p-3">Data</th><th className="p-3">Usuário</th><th className="p-3">Ação</th><th className="p-3">Entidade</th><th className="p-3">Campo</th><th className="p-3">De → Para</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3">{(r.user as { email?: string } | null)?.email ?? "—"}</td>
                  <td className="p-3">{r.action}</td>
                  <td className="p-3">{r.entity_type}</td>
                  <td className="p-3">{r.field_name ?? "—"}</td>
                  <td className="p-3 text-xs">{r.field_name ? `${JSON.stringify(r.old_value)} → ${JSON.stringify(r.new_value)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
