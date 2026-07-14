import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/server/api-auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { updateLinkWithVersion, createLinkWithVersion } from "@/lib/server/links";
import type { TrackedLink, EntityStatus } from "@/lib/types";
import { runLinkTest } from "@/lib/server/test-runner";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id, action } = await params;
  if (action !== "versions") return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  const db = createAdminSupabase();
  const { data } = await db
    .from("link_versions")
    .select("*")
    .eq("tracked_link_id", id)
    .order("version_number", { ascending: false });
  return NextResponse.json({ versions: data ?? [] });
}

const STATUS_ACTIONS: Record<string, EntityStatus> = {
  pause: "paused",
  activate: "active",
  archive: "archived",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; action: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id, action } = await params;

  const db = createAdminSupabase();
  const { data: link } = await db.from("tracked_links").select("*").eq("id", id).maybeSingle();
  if (!link) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const current = link as TrackedLink;

  // Ações de status.
  if (action in STATUS_ACTIONS) {
    const updated = await updateLinkWithVersion(
      db,
      current,
      { status: STATUS_ACTIONS[action] },
      auth.profile.id,
    );
    return NextResponse.json({ link: updated });
  }

  // Duplicar.
  if (action === "duplicate") {
    const suffix = Math.random().toString(36).slice(2, 6);
    const { id: _id, created_at, updated_at, current_version, ...rest } = current;
    void _id; void created_at; void updated_at; void current_version;
    const copy = await createLinkWithVersion(
      db,
      {
        ...rest,
        name: `${current.name} (cópia)`,
        slug: `${current.slug}-${suffix}`.slice(0, 80),
        status: "paused",
      },
      auth.profile.id,
    );
    return NextResponse.json({ link: copy }, { status: 201 });
  }

  // Teste (simulação) — não contamina métricas.
  if (action === "test") {
    const result = await runLinkTest(db, current);
    return NextResponse.json({ result });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
