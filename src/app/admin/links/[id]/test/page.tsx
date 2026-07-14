import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/server/auth";
import { LinkActions } from "../link-actions";
import type { TrackedLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TestLinkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;
  const db = await createServerSupabase();
  const { data } = await db.from("tracked_links").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const link = data as TrackedLink;
  const domain = process.env.NEXT_PUBLIC_REDIRECT_DOMAIN ?? "";
  const publicUrl = `${domain}/r/${link.slug}?test=1`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Testar: {link.name}</h1>
      <p className="text-sm text-muted-foreground">
        Cliques de teste são salvos com <code>is_test = true</code> e não entram nas métricas oficiais.
        Link de teste: <span className="font-mono text-xs">{publicUrl}</span>
      </p>
      <LinkActions id={id} status={link.status} publicUrl={publicUrl} />
    </div>
  );
}
