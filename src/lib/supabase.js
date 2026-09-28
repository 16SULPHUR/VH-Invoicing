import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Supabase returns errors in-band rather than throwing. Every service call funnels
// through here so callers can use plain try/catch.
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
