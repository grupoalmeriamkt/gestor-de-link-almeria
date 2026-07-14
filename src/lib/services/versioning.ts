import type { TrackedLink } from "@/lib/types";

// Campos cujo valor, ao mudar, exige nova versão do link.
export const VERSIONED_FIELDS: (keyof TrackedLink)[] = [
  "whatsapp_number",
  "whatsapp_message_template",
  "destination_type",
  "redirect_mode",
  "external_url",
  "capture_name",
  "capture_phone",
  "capture_email",
  "capture_interest",
  "name_required",
  "phone_required",
  "email_required",
  "interest_required",
  "landing_title",
  "landing_description",
  "button_text",
  "status",
  "starts_at",
  "ends_at",
  "unavailable_title",
  "unavailable_description",
];

/** Verdadeiro se alguma mudança exige criar nova versão. */
export function requiresNewVersion(
  before: Partial<TrackedLink>,
  after: Partial<TrackedLink>,
): boolean {
  return VERSIONED_FIELDS.some((f) => (before[f] ?? null) !== (after[f] ?? null));
}

/** Monta o snapshot jsonb de configuração para link_versions. */
export function buildSnapshot(link: TrackedLink): Record<string, unknown> {
  return {
    whatsapp_number: link.whatsapp_number,
    whatsapp_message_template: link.whatsapp_message_template,
    destination_type: link.destination_type,
    redirect_mode: link.redirect_mode,
    external_url: link.external_url,
    capture: {
      name: link.capture_name,
      phone: link.capture_phone,
      email: link.capture_email,
      interest: link.capture_interest,
    },
    required: {
      name: link.name_required,
      phone: link.phone_required,
      email: link.email_required,
      interest: link.interest_required,
    },
    landing: {
      title: link.landing_title,
      description: link.landing_description,
      button_text: link.button_text,
    },
    status: link.status,
    starts_at: link.starts_at,
    ends_at: link.ends_at,
  };
}
