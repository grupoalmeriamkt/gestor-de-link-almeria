import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { resolveLinkBySlug } from "@/lib/server/resolve-link";
import { checkAvailability } from "@/lib/services/availability";
import { getOrCreateSession, registerClick, markRedirected, SESSION_COOKIE } from "@/lib/server/tracking";
import { getActiveVersion } from "@/lib/server/links";
import { trackEvent } from "@/lib/server/events";
import { buildRequestContext, isTestRequest } from "@/lib/server/request-context";
import { buildTemplateContext } from "@/lib/server/context-builder";
import { buildWhatsappUrl } from "@/lib/services/whatsapp";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { hashIp } from "@/lib/services/crypto";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

  // Rate limit por IP.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipKey = await hashIp(ip).catch(() => ip);
  if (!(await checkRateLimit("redirect", ipKey, 60))) {
    return new NextResponse("Too many requests", { status: 429 });
  }

  const db = createAdminSupabase();
  const resolved = await resolveLinkBySlug(db, slug);

  // Link inexistente.
  if (!resolved) {
    return NextResponse.redirect(new URL(`/unavailable?reason=not_found`, appUrl));
  }

  const { link } = resolved;
  const availability = checkAvailability(link);
  if (!availability.available) {
    return NextResponse.redirect(
      new URL(`/unavailable?reason=${availability.reason}&slug=${slug}`, appUrl),
    );
  }

  const isTest = isTestRequest(req);
  const ctx = buildRequestContext(req);

  // Sessão first-party.
  const existingToken = req.cookies.get(SESSION_COOKIE)?.value ?? null;
  const session = await getOrCreateSession(db, existingToken);

  // Versão ativa + registro do clique ANTES do redirect.
  const activeVersion = await getActiveVersion(db, link);
  const click = await registerClick(db, {
    trackedLinkId: link.id,
    linkVersionId: activeVersion?.id ?? null,
    sessionId: session.sessionId,
    ctx,
    isTest,
  });

  await trackEvent(db, {
    event_name: "link_clicked",
    tracked_link_id: link.id,
    click_id: click.clickId,
    session_id: session.sessionId,
    is_test: isTest,
    metadata: { slug, referrer: ctx.referrer },
  });

  const setSessionCookie = (res: NextResponse) => {
    if (session.isNew) {
      res.cookies.set(SESSION_COOKIE, session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 180,
        path: "/",
      });
    }
    return res;
  };

  // --- Decidir destino ---
  const needsCapture =
    link.redirect_mode === "capture_simple" ||
    link.redirect_mode === "capture_complete" ||
    link.redirect_mode === "custom_landing";

  if (needsCapture) {
    const url = new URL(`/l/${slug}`, appUrl);
    url.searchParams.set("c", click.clickCode);
    if (isTest) url.searchParams.set("test", "1");
    await trackEvent(db, {
      event_name: "landing_viewed",
      tracked_link_id: link.id,
      click_id: click.clickId,
      session_id: session.sessionId,
      is_test: isTest,
    });
    return setSessionCookie(NextResponse.redirect(url));
  }

  if (link.destination_type === "external_url" && link.external_url) {
    await trackEvent(db, {
      event_name: "external_redirected",
      tracked_link_id: link.id,
      click_id: click.clickId,
      session_id: session.sessionId,
      is_test: isTest,
      metadata: { url: link.external_url },
    });
    await markRedirected(db, click.clickId);
    return setSessionCookie(NextResponse.redirect(link.external_url));
  }

  // Direct WhatsApp.
  if (link.destination_type === "whatsapp" && link.whatsapp_number) {
    const templateCtx = buildTemplateContext(resolved, { click_code: click.clickCode, ...ctx.utm });
    const waUrl = buildWhatsappUrl(
      link.whatsapp_number,
      link.whatsapp_message_template ?? "",
      templateCtx,
    );
    await trackEvent(db, {
      event_name: "whatsapp_redirected",
      tracked_link_id: link.id,
      click_id: click.clickId,
      session_id: session.sessionId,
      is_test: isTest,
      metadata: { number: link.whatsapp_number },
    });
    await markRedirected(db, click.clickId);
    return setSessionCookie(NextResponse.redirect(waUrl));
  }

  // Fallback.
  return setSessionCookie(
    NextResponse.redirect(new URL(`/unavailable?reason=misconfigured`, appUrl)),
  );
}
