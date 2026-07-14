import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { Badge } from "@/components/ui/primitives";
import { SimpleCreateForm } from "@/components/simple-create-form";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requireProfile();
  const db = await createServerSupabase();
  const { data } = await db.from("partners").select("*").order("created_at", { ascending: false });
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parceiros</h1>
        <SimpleCreateForm
          endpoint="/api/admin/partners"
          title="Novo parceiro"
          fields={[
            { name: "name", label: "Nome", required: true },
            { name: "domain", label: "Domínio" },
            { name: "contact_name", label: "Responsável" },
            { name: "contact_email", label: "Email", type: "email" },
            { name: "contact_phone", label: "Telefone" },
          ]}
        />
      </div>
      <EntityTable rows={rows} columns={[["name", "Nome"], ["domain", "Domínio"], ["contact_email", "Email"]]} />
    </div>
  );
}

function EntityTable({ rows, columns }: { rows: Record<string, unknown>[]; columns: [string, string][] }) {
  if (!rows.length) return <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">Nada cadastrado ainda.</div>;
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>{columns.map(([, l]) => <th key={l} className="p-3">{l}</th>)}<th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as string} className="border-b last:border-0">
              {columns.map(([k]) => <td key={k} className="p-3">{(r[k] as string) ?? "—"}</td>)}
              <td className="p-3"><Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status as string}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
