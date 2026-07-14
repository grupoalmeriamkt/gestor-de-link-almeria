import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const db = await createServerSupabase();
  const { data } = await db.from("system_settings").select("*").order("key");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <Card>
        <CardHeader><CardTitle>Parâmetros do sistema</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {(data ?? []).map((s) => (
                <tr key={s.key} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.key}</td>
                  <td className="py-2 font-mono text-xs">{JSON.stringify(s.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Ambiente: janela de clique único, timezone, código de país e limites de rate
        são configuráveis via <code>system_settings</code> e variáveis de ambiente.
      </p>
    </div>
  );
}
