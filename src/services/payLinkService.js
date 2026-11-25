import { supabase, unwrap } from "@/lib/supabase";
import { isMissingTable } from "@/lib/supabaseErrors";

const TABLE = "pay_links";
const DAY = 86_400_000;
// A link that is about to run out is replaced rather than sent again.
const MIN_LIFE_DAYS = 7;

const chunks = (list, size) =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, index) => list.slice(index * size, (index + 1) * size));

export const payLinkService = {
  /** One live pay link per customer key, reusing links with at least a week left. */
  async ensure(keys, validDays) {
    const tokens = new Map();
    if (keys.length === 0) return tokens;
    try {
      const freshAfter = new Date(Date.now() + MIN_LIFE_DAYS * DAY).toISOString();
      for (const part of chunks(keys, 80)) {
        const rows =
          unwrap(
            await supabase
              .from(TABLE)
              .select("token, customer_key, expires_at")
              .in("customer_key", part)
              .gt("expires_at", freshAfter)
              .order("expires_at", { ascending: false })
          ) || [];
        for (const row of rows) if (!tokens.has(row.customer_key)) tokens.set(row.customer_key, row.token);
      }

      const expiresAt = new Date(Date.now() + Math.max(validDays, MIN_LIFE_DAYS + 1) * DAY).toISOString();
      const missing = keys.filter((key) => !tokens.has(key));
      for (const part of chunks(missing, 200)) {
        const created =
          unwrap(
            await supabase
              .from(TABLE)
              .insert(part.map((customer_key) => ({ customer_key, expires_at: expiresAt })))
              .select("token, customer_key")
          ) || [];
        for (const row of created) tokens.set(row.customer_key, row.token);
      }
      return tokens;
    } catch (error) {
      if (isMissingTable(error)) return tokens;
      throw error;
    }
  },

  /** What the public page shows for a token: null when the token is unknown. */
  async getPage(token) {
    return unwrap(await supabase.rpc("get_pay_page", { p_token: token }));
  },
};
