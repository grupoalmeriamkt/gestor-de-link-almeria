import type { TemplateContext } from "@/lib/types";

// Variáveis suportadas no template da mensagem.
export const TEMPLATE_VARIABLES = [
  "nome",
  "telefone",
  "email",
  "interesse",
  "parceiro",
  "campanha",
  "banner",
  "click_id",
  "data",
  "origem",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

const VAR_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/g;

// Sentinela interna para marcar posições de variáveis vazias.
const EMPTY = String.fromCharCode(0);

// Conectores curtos que ficam órfãos quando a variável seguinte é vazia.
const CONNECTORS = "é|e|do|da|de|no|na|em|com|para|o|a|os|as";

/**
 * Retorna a lista de variáveis desconhecidas presentes no template.
 * Usado na validação (rejeitar variável desconhecida).
 */
export function findUnknownVariables(template: string): string[] {
  const unknown = new Set<string>();
  for (const match of template.matchAll(VAR_PATTERN)) {
    const name = match[1];
    if (name && !TEMPLATE_VARIABLES.includes(name as TemplateVariable)) {
      unknown.add(name);
    }
  }
  return [...unknown];
}

/**
 * Substitui as variáveis do template pelo contexto e limpa o resultado.
 */
export function resolveTemplate(
  template: string,
  context: TemplateContext,
): string {
  const resolved = template.replace(VAR_PATTERN, (_full, rawName: string) => {
    const value = context[rawName as keyof TemplateContext];
    return value != null && String(value).trim() !== "" ? String(value).trim() : EMPTY;
  });
  return cleanupResolvedText(resolved);
}

/**
 * Limpeza determinística após a substituição. Remove marcadores de variáveis
 * vazias junto com conectores/rótulos órfãos e normaliza espaços e pontuação.
 */
export function cleanupResolvedText(text: string): string {
  let out = text;

  // Rótulo órfão antes da sentinela: "Código: <M>" -> ""
  out = out.replace(new RegExp(`\\s*\\b[\\p{L}]+:\\s*${EMPTY}`, "giu"), "");

  // Conector órfão antes da sentinela: "site <M>", "nome é <M>" -> ""
  // Usa fronteira por espaço/início (não \b, que ignora letras acentuadas).
  out = out.replace(new RegExp(`(?<=^|\\s)(?:${CONNECTORS})\\s*${EMPTY}`, "giu"), "");

  // Sentinelas restantes (sem conector antes) viram vazio.
  out = out.replace(new RegExp(`\\s*${EMPTY}`, "g"), "");

  // Colapsa espaços/tabs.
  out = out.replace(/[ \t]{2,}/g, " ");

  // Remove espaço antes de pontuação.
  out = out.replace(/\s+([.,!?;:])/g, "$1");

  // Vírgula imediatamente seguida de pontuação mais forte: mantém a mais forte.
  out = out.replace(/,(\s*[.!?;:])/g, "$1");

  // Colapsa pontuação repetida (".." -> ".", ",," -> ",").
  out = out.replace(/([.,!?;:])[.,!?;:]+/g, "$1");

  // Remove espaço antes de pontuação novamente (após ajustes).
  out = out.replace(/\s+([.,!?;:])/g, "$1");

  // Normaliza quebras de linha e apara pontas.
  out = out.replace(/[ \t]*\n[ \t]*/g, "\n").trim();

  return out;
}
