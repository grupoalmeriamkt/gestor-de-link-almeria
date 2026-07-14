import "server-only";
import type { NextRequest } from "next/server";
import type { RequestContext } from "./tracking";

/** Extrai IP do request considerando proxies (Vercel). */
export function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

/** Monta o RequestContext a partir de um NextRequest. */
export function buildRequestContext(req: NextRequest): RequestContext {
  const url = req.nextUrl;
  const q = url.searchParams;
  // Geo do Vercel Edge quando disponível.
  const geo = {
    country: req.headers.get("x-vercel-ip-country"),
    region: req.headers.get("x-vercel-ip-country-region"),
    city: safeDecode(req.headers.get("x-vercel-ip-city")),
  };
  return {
    userAgent: req.headers.get("user-agent") ?? "",
    referrer: req.headers.get("referer"),
    ip: getClientIp(req),
    utm: {
      utm_source: q.get("utm_source"),
      utm_medium: q.get("utm_medium"),
      utm_campaign: q.get("utm_campaign"),
      utm_content: q.get("utm_content"),
      utm_term: q.get("utm_term"),
    },
    geo,
  };
}

function safeDecode(v: string | null): string | null {
  if (!v) return v;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Detecta modo de teste via ?test=1 ou ?test_token=... */
export function isTestRequest(req: NextRequest): boolean {
  const q = req.nextUrl.searchParams;
  return q.get("test") === "1" || !!q.get("test_token");
}
