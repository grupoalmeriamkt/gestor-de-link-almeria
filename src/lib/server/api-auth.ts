import "server-only";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type ApiAuthResult =
  | { ok: true; profile: Profile }
  | { ok: false; response: NextResponse };

/** Garante usuário autenticado com permissão de escrita (admin/operator). */
export async function requireWriter(): Promise<ApiAuthResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) {
    return { ok: false, response: NextResponse.json({ error: "no_profile" }, { status: 403 }) };
  }
  if (!["admin", "operator"].includes(profile.role)) {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { ok: true, profile: profile as Profile };
}
