import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/server/events";
import { checkRateLimit } from "@/lib/services/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "landing_viewed",
  "form_started",
  "banner_impression",
]);

const schema = z.object({
  event_name: z.string(),
  click_code: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 422 });
  if (!ALLOWED.has(parsed.data.event_name)) {
    return NextResponse.json({ error: "event_not_allowed" }, { status: 400 });
  }

  const sessionKey = parsed.data.click_code ?? "anon";
  if (!(await checkRateLimit("event", sessionKey, 120))) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const db = createAdminSupabase();
  let clickId: string | null = null;
  let trackedLinkId: string | null = null;
  let sessionId: string | null = null;
  let isTest = false;

  if (parsed.data.click_code) {
    const { data: click } = await db
      .from("clicks")
      .select("id, tracked_link_id, session_id, is_test")
      .eq("click_code", parsed.data.click_code)
      .maybeSingle();
    if (click) {
      clickId = click.id;
      trackedLinkId = click.tracked_link_id;
      sessionId = click.session_id;
      isTest = click.is_test;
    }
  }

  await trackEvent(db, {
    event_name: parsed.data.event_name as never,
    tracked_link_id: trackedLinkId,
    click_id: clickId,
    session_id: sessionId,
    is_test: isTest,
    metadata: parsed.data.metadata ?? null,
  });

  return NextResponse.json({ ok: true });
}
