import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  await requireProfile();
  const db = await createServerSupabase();
  const { data: links } = await db
    .from("tracked_links")
    .select("id, name, slug, status, destination_type, current_version, partner:partners(name)")
    .order("created_at", { ascending: false });

  const rows = links ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Links</h1>
        <Button asChild><Link href="/admin/links/new"><Plus className="size-4" /> Novo link</Link></Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Nenhum link ainda. Crie o primeiro.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Nome</th><th className="p-3">Slug</th><th className="p-3">Parceiro</th>
                <th className="p-3">Destino</th><th className="p-3">Status</th><th className="p-3">v</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3"><Link href={`/admin/links/${l.id}`} className="font-medium hover:underline">{l.name}</Link></td>
                  <td className="p-3 font-mono text-xs">/r/{l.slug}</td>
                  <td className="p-3">{(l.partner as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="p-3">{l.destination_type}</td>
                  <td className="p-3"><Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge></td>
                  <td className="p-3">{l.current_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
