import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { leadFormSchema } from "@/lib/validation";
import { resolveLinkBySlug } from "@/lib/server/resolve-link";
import { trackEvent } from "@/lib/server/events";
import { markRedirected } from "@/lib/server/tracking";
import { buildTemplateContext } from "@/lib/server/context-builder";
import { buildWhatsappUrl } from "@/lib/services/whatsapp";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { hashIp } from "@/lib/services/crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  const ipKey = await hashIp(ip).catch(() => ip);
  if (!(await checkRateLimit("lead", ipKey, 10))) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = leadFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const input = parsed.data;

  const db = createAdminSupabase();

  // Localiza o clique pelo click_code.
  const { data: click } = await db
    .from("clicks")
    .select("id, tracked_link_id, session_id, is_test, click_code, utm_source, utm_medium, utm_campaign, utm_content, utm_term")
    .eq("click_code", input.click_code)
    .maybeSingle();

  if (!click) {
    return NextResponse.json({ error: "click_not_found" }, { status: 404 });
  }

  // Resolve link + atribuição (via id -> slug).
  const { data: linkRow } = await db
    .from("tracked_links")
    .select("slug")
    .eq("id", click.tracked_link_id)
    .single();
  const resolved = linkRow ? await resolveLinkBySlug(db, linkRow.slug) : null;
  if (!resolved) {
    return NextResponse.json({ error: "link_not_found" }, { status: 404 });
  }
  const { link } = resolved;

  const isTest = click.is_test;

  // Cria/atualiza o lead associado ao clique.
  const leadPayload = {
    click_id: click.id,
    tracked_link_id: link.id,
    name: input.name || null,
    phone: input.phone || null,
    email: input.email || null,
    interest: input.interest || null,
    consent: input.consent ?? false,
    status: isTest ? "test" : "new",
    metadata: { is_test: isTest },
  };

  const { data: existing } = await db
    .from("leads")
    .select("id")
    .eq("click_id", click.id)
    .maybeSingle();

  let leadId: string;
  if (existing) {
    const { data, error } = await db
      .from("leads")
      .update(leadPayload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "lead_update_failed" }, { status: 500 });
    leadId = data.id;
  } else {
    const { data, error } = await db.from("leads").insert(leadPayload).select("id").single();
    if (error || !data) return NextResponse.json({ error: "lead_insert_failed" }, { status: 500 });
    leadId = data.id;
  }

  await trackEvent(db, {
    event_name: "lead_submitted",
    tracked_link_id: link.id,
    click_id: click.id,
    session_id: click.session_id,
    is_test: isTest,
    metadata: { lead_id: leadId },
  });

  // Monta a mensagem/URL do WhatsApp (destino whatsapp) ou usa URL externa.
  let redirectUrl: string;
  if (link.destination_type === "whatsapp" && link.whatsapp_number) {
    const templateCtx = buildTemplateContext(
      resolved,
      {
        click_code: click.click_code,
        utm_source: click.utm_source,
        utm_medium: click.utm_medium,
        utm_campaign: click.utm_campaign,
        utm_content: click.utm_content,
        utm_term: click.utm_term,
      },
      leadPayload,
    );
    redirectUrl = buildWhatsappUrl(
      link.whatsapp_number,
      link.whatsapp_message_template ?? "",
      templateCtx,
    );
    await trackEvent(db, {
      event_name: "whatsapp_redirected",
      tracked_link_id: link.id,
      click_id: click.id,
      session_id: click.session_id,
      is_test: isTest,
    });
  } else if (link.external_url) {
    redirectUrl = link.external_url;
    await trackEvent(db, {
      event_name: "external_redirected",
      tracked_link_id: link.id,
      click_id: click.id,
      session_id: click.session_id,
      is_test: isTest,
    });
  } else {
    return NextResponse.json({ error: "no_destination" }, { status: 500 });
  }

  await markRedirected(db, click.id);
  return NextResponse.json({ ok: true, redirect_url: redirectUrl });
}
