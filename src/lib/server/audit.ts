import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  field_name?: string | null;
  old_value?: unknown;
  new_value?: unknown;
  ip_hash?: string | null;
  user_agent?: string | null;
}

export async function writeAudit(db: SupabaseClient<any, any, any>, entry: AuditEntry): Promise<void> {
  try {
    await db.from("audit_logs").insert({
      user_id: entry.user_id ?? null,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      field_name: entry.field_name ?? null,
      old_value: entry.old_value ?? null,
      new_value: entry.new_value ?? null,
      ip_hash: entry.ip_hash ?? null,
      user_agent: entry.user_agent ?? null,
    });
  } catch (err) {
    console.error("[writeAudit] falhou", err);
  }
}

/** Gera entradas de auditoria por campo alterado entre dois estados. */
export async function auditFieldChanges(
  db: SupabaseClient<any, any, any>,
  base: Omit<AuditEntry, "field_name" | "old_value" | "new_value">,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
): Promise<void> {
  for (const f of fields) {
    if ((before[f] ?? null) !== (after[f] ?? null)) {
      await writeAudit(db, {
        ...base,
        field_name: f,
        old_value: before[f] ?? null,
        new_value: after[f] ?? null,
      });
    }
  }
}
