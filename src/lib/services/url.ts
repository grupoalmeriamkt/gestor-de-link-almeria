// Utilitários de URL para o encurtador.

export interface Utms {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

/** Valida se é uma URL http(s) bem-formada. */
export function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Anexa UTMs à URL de destino, preservando query existente. Vazios são ignorados. */
export function appendUtms(rawUrl: string, utms: Utms): string {
  const u = new URL(rawUrl.trim());
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    const val = utms[key];
    if (val && val.trim() !== "") u.searchParams.set(key, val.trim());
  }
  return u.toString();
}

/** Deriva um nome interno legível a partir da URL (host + caminho curto). */
export function deriveLinkName(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.trim());
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}`.slice(0, 120) || u.hostname;
  } catch {
    return "Link encurtado";
  }
}
