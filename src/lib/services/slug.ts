export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "settings",
  "dashboard",
  "r",
  "l",
  "test",
  "health",
  "auth",
  "public",
  "static",
  "_next",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface SlugValidation {
  valid: boolean;
  error?: string;
}

/** Normaliza um texto para um slug candidato. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Alfabeto para slugs curtos automáticos (sem caracteres ambíguos).
const SHORT_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Gera um slug curto aleatório (ex.: "k7m2xqp") para o encurtador. */
export function generateShortSlug(len = 7): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += SHORT_ALPHABET[bytes[i]! % SHORT_ALPHABET.length];
  return out;
}

/** Valida um slug segundo as regras do documento. */
export function validateSlug(slug: string): SlugValidation {
  if (!slug) return { valid: false, error: "Slug obrigatório." };
  if (slug.length < 3 || slug.length > 80)
    return { valid: false, error: "Slug deve ter entre 3 e 80 caracteres." };
  if (slug !== slug.toLowerCase())
    return { valid: false, error: "Slug deve ser minúsculo." };
  if (/\s/.test(slug)) return { valid: false, error: "Slug não pode conter espaços." };
  if (!SLUG_PATTERN.test(slug))
    return {
      valid: false,
      error: "Use apenas letras, números e hífen (sem hífen no início/fim).",
    };
  if (RESERVED_SLUGS.has(slug))
    return { valid: false, error: "Slug reservado pelo sistema." };
  return { valid: true };
}
