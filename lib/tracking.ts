import type { Json } from "@/types/database";
import { createServerClient } from "@/lib/supabase";

export type TrackingPayload = Record<string, unknown>;

export async function insertTrackingEvent(
  eventType: string,
  payload: TrackingPayload,
): Promise<string | null> {
  const client = createServerClient();
  if (!client) return "supabase_not_configured";

  const { error } = await client.from("tracking_events").insert({
    event_type: eventType,
    payload: payload as Json,
  });

  return error?.message ?? null;
}
