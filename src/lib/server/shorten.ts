import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateShortSlug, validateSlug } from "@/lib/services/slug";
import { appendUtms, deriveLinkName, isValidHttpUrl, type Utms } from "@/lib/services/url";
import { createLinkWithVersion } from "./links";

export interface ShortenInput extends Utms {
  url: string;
  slug?: string | null;
}

export interface ShortenResult {
  ok: boolean;
  url: string;
  slug?: string;
  external_url?: string;
  error?: string;
}

async function slugExists(db: SupabaseClient<any, any, any>, slug: string): Promise<boolean> {
  const { data } = await db.from("tracked_links").select("id").eq("slug", slug).maybeSingle();
  return !!data;
}

/** Gera um slug curto único (tenta algumas vezes em caso de colisão). */
async function uniqueShortSlug(db: SupabaseClient<any, any, any>): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const s = generateShortSlug(i < 3 ? 7 : 8);
    if (!(await slugExists(db, s))) return s;
  }
  throw new Error("Não foi possível gerar um slug único.");
}

/** Encurta uma URL criando um tracked_link do tipo URL externa (rastreável). */
export async function shortenOne(
  db: SupabaseClient<any, any, any>,
  input: ShortenInput,
  userId: string | null,
): Promise<ShortenResult> {
  const url = (input.url ?? "").trim();
  if (!isValidHttpUrl(url)) {
    return { ok: false, url: input.url, error: "URL inválida (use http:// ou https://)." };
  }

  // Slug: personalizado (validado) ou curto automático.
  let slug: string;
  if (input.slug && input.slug.trim() !== "") {
    slug = input.slug.trim().toLowerCase();
    const check = validateSlug(slug);
    if (!check.valid) return { ok: false, url, error: check.error };
    if (await slugExists(db, slug)) return { ok: false, url, error: "Este slug já está em uso." };
  } else {
    slug = await uniqueShortSlug(db);
  }

  const externalUrl = appendUtms(url, input);

  try {
    const link = await createLinkWithVersion(
      db,
      {
        name: deriveLinkName(url),
        slug,
        destination_type: "external_url",
        redirect_mode: "direct",
        external_url: externalUrl,
        capture_enabled: false,
      },
      userId,
    );
    return { ok: true, url, slug: link.slug, external_url: externalUrl };
  } catch (err) {
    console.error("[shortenOne]", err);
    return { ok: false, url, error: "Falha ao criar o link encurtado." };
  }
}
