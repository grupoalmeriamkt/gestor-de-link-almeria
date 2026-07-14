import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";

// Configuração pública mínima da landing — nunca expõe número/telefone/template.
export interface PublicLandingConfig {
  slug: string;
  capture_name: boolean;
  capture_phone: boolean;
  capture_email: boolean;
  capture_interest: boolean;
  name_required: boolean;
  phone_required: boolean;
  email_required: boolean;
  interest_required: boolean;
  landing_title: string;
  landing_description: string;
  button_text: string;
  privacy_text: string | null;
  status: string;
}

export async function getPublicLandingConfig(
  slug: string,
): Promise<PublicLandingConfig | null> {
  const db = createAdminSupabase();
  const { data } = await db
    .from("tracked_links")
    .select(
      "slug,status,capture_name,capture_phone,capture_email,capture_interest,name_required,phone_required,email_required,interest_required,landing_title,landing_description,button_text,privacy_text",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    slug: data.slug,
    status: data.status,
    capture_name: data.capture_name,
    capture_phone: data.capture_phone,
    capture_email: data.capture_email,
    capture_interest: data.capture_interest,
    name_required: data.name_required,
    phone_required: data.phone_required,
    email_required: data.email_required,
    interest_required: data.interest_required,
    landing_title: data.landing_title ?? "Fale conosco",
    landing_description: data.landing_description ?? "Preencha para continuar.",
    button_text: data.button_text ?? "Continuar para o WhatsApp",
    privacy_text: data.privacy_text,
  };
}
