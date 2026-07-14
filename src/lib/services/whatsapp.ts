import type { TemplateContext } from "@/lib/types";
import { resolveTemplate } from "./template";

/**
 * Normaliza um número de WhatsApp para o formato internacional apenas com
 * dígitos (código do país + DDD + número). Remove +, espaços, (), -, etc.
 */
export function normalizeWhatsappNumber(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

/**
 * Valida um número normalizado. Regras plausíveis para números internacionais:
 * entre 10 e 15 dígitos (E.164 máx. 15).
 */
export function isValidWhatsappNumber(input: string): boolean {
  const digits = normalizeWhatsappNumber(input);
  if (digits.length < 10 || digits.length > 15) return false;
  // Não pode ser tudo zero / repetição trivial.
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
}

/**
 * Formata para exibição amigável: +55 (61) 99999-9999 quando reconhecível como BR,
 * caso contrário +<codigo> <resto>.
 */
export function formatWhatsappNumber(input: string): string {
  const d = normalizeWhatsappNumber(input);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const country = d.slice(0, 2);
    const area = d.slice(2, 4);
    const rest = d.slice(4);
    const half = rest.length === 9 ? 5 : 4;
    return `+${country} (${area}) ${rest.slice(0, half)}-${rest.slice(half)}`;
  }
  return `+${d}`;
}

/**
 * Monta a URL final do WhatsApp, resolvendo o template com o contexto e
 * codificando a mensagem. Nunca persistir esta URL — gerar em runtime.
 */
export function buildWhatsappUrl(
  rawNumber: string,
  messageTemplate: string,
  context: TemplateContext,
): string {
  const number = normalizeWhatsappNumber(rawNumber);
  const message = resolveTemplate(messageTemplate ?? "", context);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}
