import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { trackedLinkUpdateSchema, normalizeLinkInput } from "@/lib/validation";
import { updateLinkWithVersion } from "@/lib/server/links";
import type { TrackedLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const db = createAdminSupabase();
  const { data } = await db.from("tracked_links").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ link: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = trackedLinkUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.flatten() }, { status: 422 });
  }

  const db = createAdminSupabase();
  const { data: before } = await db.from("tracked_links").select("*").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Se mudar slug, garantir unicidade.
  if (parsed.data.slug && parsed.data.slug !== (before as TrackedLink).slug) {
    const { data: dup } = await db
      .from("tracked_links")
      .select("id")
      .eq("slug", parsed.data.slug)
      .maybeSingle();
    if (dup) {
      return NextResponse.json(
        { error: "validation", issues: { fieldErrors: { slug: ["Slug já existe."] } } },
        { status: 409 },
      );
    }
  }

  try {
    const input = normalizeLinkInput(parsed.data as never);
    const link = await updateLinkWithVersion(db, before as TrackedLink, input, auth.profile.id);
    return NextResponse.json({ link });
  } catch (err) {
    console.error("[PATCH /api/admin/links/:id]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
