import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";

/** Carrega parceiros/campanhas/posicionamentos ativos para popular selects. */
export async function loadLinkFormData() {
  const db = await createServerSupabase();
  const [partners, campaigns, placements] = await Promise.all([
    db.from("partners").select("id, name").eq("status", "active").order("name"),
    db.from("campaigns").select("id, name, partner_id").eq("status", "active").order("name"),
    db.from("placements").select("id, name, campaign_id").eq("status", "active").order("name"),
  ]);
  return {
    partners: partners.data ?? [],
    campaigns: campaigns.data ?? [],
    placements: placements.data ?? [],
  };
}
