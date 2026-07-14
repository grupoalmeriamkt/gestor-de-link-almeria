import type { TemplateContext } from "@/lib/types";
import type { ResolvedLink } from "./resolve-link";

interface ClickLike {
  click_code?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

interface LeadLike {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  interest?: string | null;
}

/** Monta o contexto de variáveis para resolução do template. */
export function buildTemplateContext(
  resolved: Pick<ResolvedLink, "partner" | "campaign" | "placement">,
  click: ClickLike,
  lead?: LeadLike,
): TemplateContext {
  return {
    nome: lead?.name ?? null,
    telefone: lead?.phone ?? null,
    email: lead?.email ?? null,
    interesse: lead?.interest ?? null,
    parceiro: resolved.partner?.name ?? null,
    campanha: resolved.campaign?.name ?? null,
    banner: resolved.placement?.name ?? null,
    click_id: click.click_code ?? null,
    data: new Date().toLocaleDateString("pt-BR"),
    origem: click.utm_source ?? resolved.partner?.name ?? null,
    utm_source: click.utm_source ?? null,
    utm_medium: click.utm_medium ?? null,
    utm_campaign: click.utm_campaign ?? null,
    utm_content: click.utm_content ?? null,
    utm_term: click.utm_term ?? null,
  };
}
