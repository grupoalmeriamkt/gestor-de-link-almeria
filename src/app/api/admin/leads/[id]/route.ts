import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { leadUpdateSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/server/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = leadUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  const db = createAdminSupabase();
  const { data, error } = await db.from("leads").update(parsed.data).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await writeAudit(db, { user_id: auth.profile.id, action: "update", entity_type: "lead", entity_id: id, new_value: parsed.data });
  return NextResponse.json({ lead: data });
}
