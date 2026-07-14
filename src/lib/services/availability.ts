import type { TrackedLink } from "@/lib/types";

export type AvailabilityReason =
  | "ok"
  | "paused"
  | "archived"
  | "not_started"
  | "expired";

export interface AvailabilityResult {
  available: boolean;
  reason: AvailabilityReason;
}

/** Verifica se um link está apto a redirecionar no instante `now`. */
export function checkAvailability(
  link: Pick<TrackedLink, "status" | "starts_at" | "ends_at">,
  now: Date = new Date(),
): AvailabilityResult {
  if (link.status === "paused") return { available: false, reason: "paused" };
  if (link.status === "archived") return { available: false, reason: "archived" };
  if (link.starts_at && new Date(link.starts_at) > now)
    return { available: false, reason: "not_started" };
  if (link.ends_at && new Date(link.ends_at) < now)
    return { available: false, reason: "expired" };
  return { available: true, reason: "ok" };
}
