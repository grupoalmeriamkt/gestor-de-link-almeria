import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackedLink } from "@/lib/types";
import { validateSlug } from "@/lib/services/slug";
import { isValidWhatsappNumber } from "@/lib/services/whatsapp";
import { findUnknownVariables, resolveTemplate } from "@/lib/services/template";
import { buildWhatsappUrl } from "@/lib/services/whatsapp";
import { checkAvailability } from "@/lib/services/availability";
import { resolveLinkBySlug } from "./resolve-link";
import { buildTemplateContext } from "./context-builder";

export interface TestCheck {
  label: string;
  status: "success" | "error" | "skip";
  detail?: string;
}

export interface TestResult {
  checks: TestCheck[];
  message_preview: string | null;
  url_preview: string | null;
  passed: boolean;
}

/** Executa o "teste completo" de um link em modo simulação. */
export async function runLinkTest(db: SupabaseClient<any, any, any>, link: TrackedLink): Promise<TestResult> {
  const checks: TestCheck[] = [];
  const add = (label: string, ok: boolean, detail?: string) =>
    checks.push({ label, status: ok ? "success" : "error", detail });

  add("Link existe", true);
  const slug = validateSlug(link.slug);
  add("Slug válido", slug.valid, slug.error);

  const avail = checkAvailability(link);
  add("Status/Período", avail.available, avail.reason);

  // Versão ativa.
  const { data: version } = await db
    .from("link_versions")
    .select("id")
    .eq("tracked_link_id", link.id)
    .eq("version_number", link.current_version)
    .maybeSingle();
  add("Versão ativa", !!version);

  let messagePreview: string | null = null;
  let urlPreview: string | null = null;

  if (link.destination_type === "whatsapp") {
    const numberOk = !!link.whatsapp_number && isValidWhatsappNumber(link.whatsapp_number);
    add("Número válido", numberOk, link.whatsapp_number ?? undefined);

    const template = link.whatsapp_message_template ?? "";
    const unknown = findUnknownVariables(template);
    add("Template válido", template.trim() !== "" && unknown.length === 0,
      unknown.length ? `Variáveis desconhecidas: ${unknown.join(", ")}` : undefined);

    // Contexto simulado.
    const resolved = await resolveLinkBySlug(db, link.slug);
    const ctx = buildTemplateContext(
      resolved ?? { partner: null, campaign: null, placement: null },
      { click_code: "CKTEST" },
      { name: "Fulano", phone: "5561999999999", email: "teste@exemplo.com", interest: "Teste" },
    );
    messagePreview = resolveTemplate(template, ctx);
    add("Variáveis substituídas", messagePreview.length > 0);

    if (numberOk) {
      urlPreview = buildWhatsappUrl(link.whatsapp_number!, template, ctx);
      add("URL final gerada", urlPreview.startsWith("https://wa.me/"));
    }
  } else if (link.destination_type === "external_url") {
    const ok = /^https?:\/\//i.test(link.external_url ?? "");
    add("URL externa válida", ok, link.external_url ?? undefined);
    urlPreview = link.external_url ?? null;
  }

  // Formulário coerente.
  const captureOk =
    link.redirect_mode === "direct" ||
    link.destination_type === "external_url" ||
    link.capture_name || link.capture_phone || link.capture_email || link.capture_interest;
  add("Formulário coerente", captureOk);

  const passed = checks.every((c) => c.status !== "error");
  return { checks, message_preview: messagePreview, url_preview: urlPreview, passed };
}
