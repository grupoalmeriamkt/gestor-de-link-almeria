// Hash de IP e de tokens usando HMAC-SHA256 com segredo de ambiente.
// Runtime: Web Crypto (compatível com Node 20+ e Edge).

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** HMAC_SHA256(IP_HASH_SECRET, ip). Nunca persistir o IP puro. */
export function hashIp(ip: string): Promise<string> {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) throw new Error("IP_HASH_SECRET ausente");
  return hmacSha256Hex(secret, ip.trim());
}

/** Hash de tokens (sessão, teste) para armazenar sem expor o valor bruto. */
export function hashToken(token: string, secretEnv = "SESSION_COOKIE_SECRET"): Promise<string> {
  const secret = process.env[secretEnv];
  if (!secret) throw new Error(`${secretEnv} ausente`);
  return hmacSha256Hex(secret, token);
}

/** Anonimiza um IP para uso pontual quando não há segredo (fallback). */
export function anonymizeIp(ip: string): string {
  if (ip.includes(".")) {
    const p = ip.split(".");
    return `${p[0]}.${p[1]}.${p[2]}.0`;
  }
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + "::";
  }
  return "unknown";
}
