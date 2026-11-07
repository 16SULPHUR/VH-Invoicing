import { supabase, unwrap } from "@/lib/supabase";
import { isMissingTable } from "@/lib/supabaseErrors";

const TABLE = "shop_settings";
const LOCAL_KEY = "vh.shopSettings";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeLocal(values) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(values));
  } catch {
    // Storage full or blocked: the values still apply for this visit.
  }
}

const toRows = (values) =>
  Object.entries(values).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));

/**
 * Shop-wide key/value settings. Kept in Supabase once docs/schema/sticker_designer.sql
 * has been run, and always mirrored in this browser so they work offline and before then.
 * `stored` says where the values live: "cloud", "device" (no table yet) or "offline".
 */
export const shopSettingsService = {
  readLocal,

  async load() {
    const local = readLocal();
    try {
      const rows = unwrap(await supabase.from(TABLE).select("key, value")) || [];
      const remote = Object.fromEntries(rows.map(({ key, value }) => [key, value]));
      const unsynced = Object.fromEntries(Object.entries(local).filter(([key]) => !(key in remote)));
      if (Object.keys(unsynced).length > 0) {
        unwrap(await supabase.from(TABLE).upsert(toRows(unsynced)));
      }
      const values = { ...local, ...remote };
      writeLocal(values);
      return { values, stored: "cloud" };
    } catch (error) {
      return { values: local, stored: isMissingTable(error) ? "device" : "offline" };
    }
  },

  async save(changes) {
    const values = { ...readLocal(), ...changes };
    writeLocal(values);
    try {
      unwrap(await supabase.from(TABLE).upsert(toRows(changes)));
      return { values, stored: "cloud" };
    } catch (error) {
      if (isMissingTable(error)) return { values, stored: "device" };
      throw error;
    }
  },
};
