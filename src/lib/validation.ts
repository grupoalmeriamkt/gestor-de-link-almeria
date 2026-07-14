import { z } from "zod";
import { validateSlug } from "@/lib/services/slug";
import { isValidWhatsappNumber, normalizeWhatsappNumber } from "@/lib/services/whatsapp";
import { findUnknownVariables } from "@/lib/services/template";

const status = z.enum(["active", "paused", "archived"]);
const destinationType = z.enum(["whatsapp", "external_url", "internal_landing"]);
const redirectMode = z.enum([
  "direct",
  "capture_simple",
  "capture_complete",
  "custom_landing",
]);

export const partnerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(200),
  domain: z.string().max(200).optional().or(z.literal("")),
  contact_name: z.string().max(200).optional().or(z.literal("")),
  contact_email: z.string().email("Email inválido").optional().or(z.literal("")),
  contact_phone: z.string().max(50).optional().or(z.literal("")),
  status: status.default("active"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});
export type PartnerInput = z.infer<typeof partnerSchema>;

export const campaignSchema = z
  .object({
    partner_id: z.string().uuid("Parceiro obrigatório"),
    name: z.string().min(1, "Nome obrigatório").max(200),
    description: z.string().max(2000).optional().or(z.literal("")),
    objective: z.string().max(500).optional().or(z.literal("")),
    budget: z.coerce.number().nonnegative().optional().nullable(),
    status: status.default("active"),
    starts_at: z.string().datetime().optional().nullable(),
    ends_at: z.string().datetime().optional().nullable(),
  })
  .refine((d) => !d.starts_at || !d.ends_at || d.ends_at >= d.starts_at, {
    message: "Data final não pode ser anterior à inicial.",
    path: ["ends_at"],
  });
export type CampaignInput = z.infer<typeof campaignSchema>;

export const placementSchema = z.object({
  campaign_id: z.string().uuid("Campanha obrigatória"),
  name: z.string().min(1, "Nome obrigatório").max(200),
  partner_page: z.string().max(500).optional().or(z.literal("")),
  position_name: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  dimensions: z.string().max(50).optional().or(z.literal("")),
  reference_url: z.string().url("URL inválida").optional().or(z.literal("")),
  status: status.default("active"),
});
export type PlacementInput = z.infer<typeof placementSchema>;

const trackedLinkObject = z.object({
    name: z.string().min(1, "Nome obrigatório").max(200),
    slug: z.string(),
    description: z.string().max(2000).optional().or(z.literal("")),
    partner_id: z.string().uuid().optional().nullable(),
    campaign_id: z.string().uuid().optional().nullable(),
    placement_id: z.string().uuid().optional().nullable(),
    destination_type: destinationType,
    redirect_mode: redirectMode,
    whatsapp_number: z.string().optional().nullable(),
    whatsapp_message_template: z.string().max(2000).optional().nullable(),
    external_url: z.string().optional().nullable(),
    capture_enabled: z.boolean().default(false),
    capture_name: z.boolean().default(true),
    capture_phone: z.boolean().default(false),
    capture_email: z.boolean().default(false),
    capture_interest: z.boolean().default(false),
    name_required: z.boolean().default(false),
    phone_required: z.boolean().default(false),
    email_required: z.boolean().default(false),
    interest_required: z.boolean().default(false),
    landing_title: z.string().max(200).optional().nullable(),
    landing_description: z.string().max(1000).optional().nullable(),
    button_text: z.string().max(80).optional().nullable(),
    success_message: z.string().max(500).optional().nullable(),
    privacy_text: z.string().max(1000).optional().nullable(),
    unavailable_title: z.string().max(200).optional().nullable(),
    unavailable_description: z.string().max(1000).optional().nullable(),
    status: status.default("active"),
    starts_at: z.string().datetime().optional().nullable(),
    ends_at: z.string().datetime().optional().nullable(),
  });

export const trackedLinkSchema = trackedLinkObject.superRefine((d, ctx) => {
    const slugCheck = validateSlug(d.slug);
    if (!slugCheck.valid) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: slugCheck.error });
    }
    if (d.starts_at && d.ends_at && d.ends_at < d.starts_at) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "Data final não pode ser anterior à inicial.",
      });
    }
    if (d.destination_type === "whatsapp") {
      if (!d.whatsapp_number || !isValidWhatsappNumber(d.whatsapp_number)) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsapp_number"],
          message: "Número de WhatsApp inválido (formato internacional).",
        });
      }
      if (!d.whatsapp_message_template || d.whatsapp_message_template.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["whatsapp_message_template"],
          message: "Mensagem obrigatória para destino WhatsApp.",
        });
      }
    }
    if (d.whatsapp_message_template) {
      const unknown = findUnknownVariables(d.whatsapp_message_template);
      if (unknown.length) {
        ctx.addIssue({
          code: "custom",
          path: ["whatsapp_message_template"],
          message: `Variáveis desconhecidas: ${unknown.join(", ")}`,
        });
      }
    }
    if (d.destination_type === "external_url") {
      const url = d.external_url ?? "";
      const ok = /^https?:\/\//i.test(url);
      if (!ok) {
        ctx.addIssue({
          code: "custom",
          path: ["external_url"],
          message: "URL externa inválida (use http(s)://).",
        });
      } else if (process.env.NODE_ENV === "production" && !/^https:\/\//i.test(url)) {
        ctx.addIssue({
          code: "custom",
          path: ["external_url"],
          message: "URL externa deve usar HTTPS em produção.",
        });
      }
    }
  });
export type TrackedLinkInput = z.infer<typeof trackedLinkSchema>;

// Para PATCH parcial (todos os campos opcionais, sem refinamentos cruzados).
export const trackedLinkUpdateSchema = trackedLinkObject.partial();
export type TrackedLinkUpdateInput = z.infer<typeof trackedLinkUpdateSchema>;

/** Normaliza campos antes de persistir (ex.: número do WhatsApp). */
export function normalizeLinkInput(input: TrackedLinkInput): TrackedLinkInput {
  return {
    ...input,
    whatsapp_number: input.whatsapp_number
      ? normalizeWhatsappNumber(input.whatsapp_number)
      : input.whatsapp_number,
  };
}

// ------- Formulário público (lead) -------
export const leadFormSchema = z.object({
  click_code: z.string().min(3).max(20),
  name: z.string().max(200).optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  interest: z.string().max(500).optional().or(z.literal("")),
  consent: z.boolean().optional().default(false),
});
export type LeadFormInput = z.infer<typeof leadFormSchema>;

export const leadUpdateSchema = z.object({
  status: z
    .enum(["new", "contacted", "qualified", "converted", "lost", "invalid", "test"])
    .optional(),
  notes: z.string().max(4000).optional().nullable(),
});
