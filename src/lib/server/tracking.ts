import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateClickCode, generateSessionToken } from "@/lib/services/click-code";
import { hashToken, hashIp } from "@/lib/services/crypto";
import { parseUserAgent } from "@/lib/services/user-agent";

export const SESSION_COOKIE = "glr_session";

export interface RequestContext {
  userAgent: string;
  referrer: string | null;
  ip: string | null;
  utm: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  geo?: { country?: string | null; region?: string | null; city?: string | null };
}

/**
 * Recupera ou cria uma sessão a partir do token do cookie first-party.
 * Retorna o session_id e o token (para o caller gravar o cookie se for novo).
 */
export async function getOrCreateSession(
  db: SupabaseClient<any, any, any>,
  existingToken: string | null,
): Promise<{ sessionId: string; token: string; isNew: boolean }> {
  if (existingToken) {
    const tokenHash = await hashToken(existingToken);
    const { data } = await db
      .from("sessions")
      .select("id")
      .eq("session_token_hash", tokenHash)
      .maybeSingle();
    if (data?.id) {
      await db.from("sessions").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
      return { sessionId: data.id, token: existingToken, isNew: false };
    }
  }
  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const { data, error } = await db
    .from("sessions")
    .insert({ session_token_hash: tokenHash })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar sessão: ${error?.message}`);
  return { sessionId: data.id, token, isNew: true };
}

export interface RegisteredClick {
  clickId: string;
  clickCode: string;
}

/** Registra o clique ANTES do redirect. */
export async function registerClick(
  db: SupabaseClient<any, any, any>,
  params: {
    trackedLinkId: string;
    linkVersionId: string | null;
    sessionId: string;
    ctx: RequestContext;
    isTest: boolean;
  },
): Promise<RegisteredClick> {
  const ua = parseUserAgent(params.ctx.userAgent);
  const ipHash = params.ctx.ip ? await hashIp(params.ctx.ip).catch(() => null) : null;
  const clickCode = generateClickCode();

  const { data, error } = await db
    .from("clicks")
    .insert({
      click_code: clickCode,
      tracked_link_id: params.trackedLinkId,
      link_version_id: params.linkVersionId,
      session_id: params.sessionId,
      referrer: params.ctx.referrer,
      utm_source: params.ctx.utm.utm_source ?? null,
      utm_medium: params.ctx.utm.utm_medium ?? null,
      utm_campaign: params.ctx.utm.utm_campaign ?? null,
      utm_content: params.ctx.utm.utm_content ?? null,
      utm_term: params.ctx.utm.utm_term ?? null,
      device_type: ua.device_type,
      browser: ua.browser,
      operating_system: ua.operating_system,
      country: params.ctx.geo?.country ?? null,
      region: params.ctx.geo?.region ?? null,
      city: params.ctx.geo?.city ?? null,
      ip_hash: ipHash,
      user_agent: params.ctx.userAgent,
      is_bot: ua.is_bot,
      is_test: params.isTest,
    })
    .select("id, click_code")
    .single();

  if (error || !data) throw new Error(`Falha ao registrar clique: ${error?.message}`);
  return { clickId: data.id, clickCode: data.click_code };
}

export async function markRedirected(db: SupabaseClient<any, any, any>, clickId: string): Promise<void> {
  await db.from("clicks").update({ redirected_at: new Date().toISOString() }).eq("id", clickId);
}
