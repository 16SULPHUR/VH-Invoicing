// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_URL,
  import.meta.env.VITE_ANON,
);
