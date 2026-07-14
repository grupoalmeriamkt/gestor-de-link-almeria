import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Profile, UserRole } from "@/lib/types";

/**
 * Retorna o profile do usuário autenticado. Se ainda não existir (primeiro
 * login), cria via service role — o PRIMEIRO perfil do sistema vira `admin`.
 * Não usamos trigger em auth.users para não interferir em outros apps que
 * compartilham o mesmo projeto Supabase.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data as Profile;

  // Bootstrap do perfil (primeiro acesso).
  const admin = createAdminSupabase();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });
  const role: UserRole = (count ?? 0) === 0 ? "admin" : "operator";
  const { data: created } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? user.email,
      role,
    })
    .select("*")
    .single();
  return (created as Profile) ?? null;
}

/** Exige autenticação; redireciona para /login se não houver sessão. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Exige um dos roles informados; redireciona para /admin se não autorizado. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/admin?forbidden=1");
  return profile;
}

export function canWrite(role: UserRole): boolean {
  return role === "admin" || role === "operator";
}
