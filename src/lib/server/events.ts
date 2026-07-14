import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventName } from "@/lib/types";

export interface TrackEventInput {
  event_name: EventName;
  tracked_link_id?: string | null;
  click_id?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
  is_test?: boolean;
}

/**
 * Serviço central de eventos. Nunca lança para não interromper o redirect:
 * falhas são logadas e engolidas.
 */
export async function trackEvent(
  db: SupabaseClient<any, any, any>,
  input: TrackEventInput,
): Promise<void> {
  try {
    const { error } = await db.from("events").insert({
      event_name: input.event_name,
      tracked_link_id: input.tracked_link_id ?? null,
      click_id: input.click_id ?? null,
      session_id: input.session_id ?? null,
      metadata: input.metadata ?? null,
      is_test: input.is_test ?? false,
    });
    if (error) console.error("[trackEvent] insert falhou", input.event_name, error.message);
  } catch (err) {
    console.error("[trackEvent] exceção", err);
  }
}
