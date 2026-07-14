import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackedLink, Partner, Campaign, Placement } from "@/lib/types";

export interface ResolvedLink {
  link: TrackedLink;
  partner: Pick<Partner, "id" | "name"> | null;
  campaign: Pick<Campaign, "id" | "name"> | null;
  placement: Pick<Placement, "id" | "name"> | null;
}

/** Busca o link pelo slug com dados de atribuição (parceiro/campanha/posicionamento). */
export async function resolveLinkBySlug(
  db: SupabaseClient<any, any, any>,
  slug: string,
): Promise<ResolvedLink | null> {
  const { data } = await db
    .from("tracked_links")
    .select(
      "*, partner:partners(id,name), campaign:campaigns(id,name), placement:placements(id,name)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const { partner, campaign, placement, ...link } = data as unknown as TrackedLink & {
    partner: Pick<Partner, "id" | "name"> | null;
    campaign: Pick<Campaign, "id" | "name"> | null;
    placement: Pick<Placement, "id" | "name"> | null;
  };
  return { link, partner, campaign, placement };
}
