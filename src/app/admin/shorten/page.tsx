import { requireRole } from "@/lib/server/auth";
import { ShortenTool } from "./shorten-tool";

export const dynamic = "force-dynamic";

export default async function ShortenPage() {
  await requireRole(["admin", "operator"]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Encurtar link</h1>
        <p className="text-sm text-muted-foreground">
          Gere links curtos e rastreáveis. Cada link encurtado registra cliques, UTMs e
          dispositivo, e aparece na lista de links e no dashboard.
        </p>
      </div>
      <ShortenTool />
    </div>
  );
}
