import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireRole } from "@/lib/server/auth";
import { loadLinkFormData } from "@/lib/server/form-data";
import { LinkForm } from "../../link-form";
import type { TrackedLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["admin", "operator"]);
  const { id } = await params;
  const db = await createServerSupabase();
  const { data } = await db.from("tracked_links").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { partners, campaigns, placements } = await loadLinkFormData();
  const redirectDomain = process.env.NEXT_PUBLIC_REDIRECT_DOMAIN ?? "";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar link</h1>
      <LinkForm mode="edit" initial={data as TrackedLink} partners={partners} campaigns={campaigns} placements={placements} redirectDomain={redirectDomain} />
    </div>
  );
}
