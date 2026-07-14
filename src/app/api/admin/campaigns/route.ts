import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { campaignSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const parsed = campaignSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  const db = createAdminSupabase();
  const clean = Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v]));
  const { data, error } = await db.from("campaigns").insert(clean).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(db, { user_id: auth.profile.id, action: "create", entity_type: "campaign", entity_id: data.id, new_value: { name: data.name } });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
