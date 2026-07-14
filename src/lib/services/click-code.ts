// Geração de código público curto para cliques (ex.: "CK72DA").
// Alfabeto sem caracteres ambíguos (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Gera um click_code curto e legível. `size` = nº de caracteres após o prefixo. */
export function generateClickCode(size = 6, prefix = "CK"): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < size; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return prefix + out;
}

/** Token opaco para cookie de sessão first-party. */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
