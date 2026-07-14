import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { trackedLinkSchema, normalizeLinkInput } from "@/lib/validation";
import { createLinkWithVersion } from "@/lib/server/links";
import { validateSlug } from "@/lib/services/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const db = createAdminSupabase();
  const { data } = await db
    .from("tracked_links")
    .select("*, partner:partners(name), campaign:campaigns(name)")
    .order("created_at", { ascending: false });
  return NextResponse.json({ links: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = trackedLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }
  const slugCheck = validateSlug(parsed.data.slug);
  if (!slugCheck.valid) {
    return NextResponse.json({ error: "validation", issues: { fieldErrors: { slug: [slugCheck.error] } } }, { status: 422 });
  }

  const db = createAdminSupabase();

  // Slug único.
  const { data: existing } = await db
    .from("tracked_links")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "validation", issues: { fieldErrors: { slug: ["Slug já existe."] } } },
      { status: 409 },
    );
  }

  try {
    const input = normalizeLinkInput(parsed.data);
    const link = await createLinkWithVersion(db, input, auth.profile.id);
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/links]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
