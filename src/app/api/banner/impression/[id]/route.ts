import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/server/events";
import { getOrCreateSession, SESSION_COOKIE } from "@/lib/server/tracking";
import { isBotUserAgent } from "@/lib/services/user-agent";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { hashIp } from "@/lib/services/crypto";

export const dynamic = "force-dynamic";

// GIF transparente 1x1.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipKey = await hashIp(ip).catch(() => ip);

  const respondPixel = (extraCookie?: { name: string; value: string }) => {
    const res = new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
      },
    });
    if (extraCookie) {
      res.cookies.set(extraCookie.name, extraCookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 180,
        path: "/",
      });
    }
    return res;
  };

  // A ausência/erro do pixel nunca deve quebrar o site do parceiro.
  if (!(await checkRateLimit("impression", ipKey, 120))) {
    return respondPixel();
  }

  try {
    const db = createAdminSupabase();
    const { data: link } = await db
      .from("tracked_links")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!link) return respondPixel();

    const existingToken = req.cookies.get(SESSION_COOKIE)?.value ?? null;
    const session = await getOrCreateSession(db, existingToken);

    await trackEvent(db, {
      event_name: "banner_impression",
      tracked_link_id: link.id,
      session_id: session.sessionId,
      is_test: false,
      metadata: { is_bot: isBotUserAgent(req.headers.get("user-agent") ?? "") },
    });

    return respondPixel(
      session.isNew ? { name: SESSION_COOKIE, value: session.token } : undefined,
    );
  } catch (err) {
    console.error("[impression] erro", err);
    return respondPixel();
  }
}
