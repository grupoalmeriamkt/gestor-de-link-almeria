import { requireRole } from "@/lib/server/auth";
import { loadLinkFormData } from "@/lib/server/form-data";
import { LinkForm } from "../link-form";

export const dynamic = "force-dynamic";

export default async function NewLinkPage() {
  await requireRole(["admin", "operator"]);
  const { partners, campaigns, placements } = await loadLinkFormData();
  const redirectDomain = process.env.NEXT_PUBLIC_REDIRECT_DOMAIN ?? "";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Novo link</h1>
      <LinkForm mode="create" partners={partners} campaigns={campaigns} placements={placements} redirectDomain={redirectDomain} />
    </div>
  );
}
