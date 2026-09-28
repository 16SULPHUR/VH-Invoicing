import { supabase, unwrap } from "@/lib/supabase";
import { isMissingColumn } from "@/lib/supabaseErrors";
import { SYNC_STATUS } from "@/lib/offline/db";

const siteUrl = () => (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");

export const billUrl = (code, origin = siteUrl()) => `${origin}/b/${code}`;

export const billLinkService = {
  /** The bill's public link, or null for bills not synced yet or before bill_links.sql is run. */
  async linkFor(invoice, origin) {
    if (!invoice || (invoice._syncStatus && invoice._syncStatus !== SYNC_STATUS.SYNCED))
      return null;
    if (invoice.share_code) return billUrl(invoice.share_code, origin);
    const { data, error } = await supabase
      .from("invoices")
      .select("share_code")
      .eq("date", invoice.date)
      .maybeSingle();
    if (error) {
      if (isMissingColumn(error)) return null;
      throw error;
    }
    return data?.share_code ? billUrl(data.share_code, origin) : null;
  },

  async getPublicBill(code) {
    return unwrap(await supabase.rpc("get_public_bill", { p_code: code }));
  },
};
