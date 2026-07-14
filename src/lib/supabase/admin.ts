import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com SERVICE ROLE — ignora RLS. Uso EXCLUSIVO no servidor, para o
 * fluxo público (redirect, clique, evento, lead) e operações administrativas
 * privilegiadas. Nunca importar em código de cliente.
 */
export function createAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "links" },
  });
}
