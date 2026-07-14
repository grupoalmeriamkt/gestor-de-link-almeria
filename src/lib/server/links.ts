import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrackedLink } from "@/lib/types";
import { buildSnapshot, requiresNewVersion } from "@/lib/services/versioning";
import { auditFieldChanges, writeAudit } from "./audit";
import { VERSIONED_FIELDS } from "@/lib/services/versioning";

/** Cria uma nova versão a partir do estado atual do link e a marca como ativa. */
export async function createVersion(
  db: SupabaseClient<any, any, any>,
  link: TrackedLink,
  userId: string | null,
): Promise<string> {
  const versionNumber = link.current_version;
  const { data, error } = await db
    .from("link_versions")
    .insert({
      tracked_link_id: link.id,
      version_number: versionNumber,
      whatsapp_number: link.whatsapp_number,
      whatsapp_message_template: link.whatsapp_message_template,
      destination_type: link.destination_type,
      redirect_mode: link.redirect_mode,
      external_url: link.external_url,
      configuration_snapshot: buildSnapshot(link),
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Falha ao criar versão: ${error?.message}`);
  return data.id;
}

/** Retorna a versão ativa (version_number == current_version) do link. */
export async function getActiveVersion(
  db: SupabaseClient<any, any, any>,
  link: Pick<TrackedLink, "id" | "current_version">,
): Promise<{ id: string } | null> {
  const { data } = await db
    .from("link_versions")
    .select("id")
    .eq("tracked_link_id", link.id)
    .eq("version_number", link.current_version)
    .maybeSingle();
  return data;
}

/** Cria o link e sua versão inicial (v1). */
export async function createLinkWithVersion(
  db: SupabaseClient<any, any, any>,
  input: Partial<TrackedLink>,
  userId: string | null,
): Promise<TrackedLink> {
  const { data, error } = await db
    .from("tracked_links")
    .insert({ ...input, current_version: 1, created_by: userId })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Falha ao criar link: ${error?.message}`);
  const link = data as TrackedLink;
  await createVersion(db, link, userId);
  await writeAudit(db, {
    user_id: userId,
    action: "create",
    entity_type: "tracked_link",
    entity_id: link.id,
    new_value: { slug: link.slug, name: link.name },
  });
  return link;
}

/**
 * Atualiza o link. Se algum campo versionado mudou, incrementa current_version
 * e cria uma nova versão-snapshot. Sempre registra auditoria por campo.
 */
export async function updateLinkWithVersion(
  db: SupabaseClient<any, any, any>,
  before: TrackedLink,
  input: Partial<TrackedLink>,
  userId: string | null,
): Promise<TrackedLink> {
  const merged = { ...before, ...input } as TrackedLink;
  const bumpVersion = requiresNewVersion(before, merged);
  const nextVersion = bumpVersion ? before.current_version + 1 : before.current_version;

  const { data, error } = await db
    .from("tracked_links")
    .update({ ...input, current_version: nextVersion })
    .eq("id", before.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Falha ao atualizar link: ${error?.message}`);
  const after = data as TrackedLink;

  if (bumpVersion) {
    await createVersion(db, after, userId);
  }
  await auditFieldChanges(
    db,
    { user_id: userId, action: "update", entity_type: "tracked_link", entity_id: after.id },
    before as unknown as Record<string, unknown>,
    after as unknown as Record<string, unknown>,
    VERSIONED_FIELDS as string[],
  );
  return after;
}
