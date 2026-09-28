import { supabase, unwrap } from "@/lib/supabase";
import { db } from "@/lib/offline/db";
import { isNetworkError, withOfflineFallback } from "@/lib/offline/network";
import { isMissingColumn, isMissingTable } from "@/lib/supabaseErrors";

const PAGE = 1000;
const LOG_TABLE = "wa_log";
const LOCAL_LOG = "vh.waLog";
const LOCAL_LOG_LIMIT = 3000;
const INVOICE_COLUMNS = "id, date, customerName, customerNumber, total, credit";

const escapeLike = (text) => text.replace(/[%_\\]/g, (char) => `\\${char}`);

/** PostgREST caps a response at 1000 rows, so read in pages. */
async function readAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(await build().range(from, from + PAGE - 1)) || [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

function readLocalLog() {
  try {
    const entries = JSON.parse(localStorage.getItem(LOCAL_LOG));
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function writeLocalLog(entries) {
  try {
    localStorage.setItem(LOCAL_LOG, JSON.stringify(entries.slice(0, LOCAL_LOG_LIMIT)));
  } catch {
    // Storage full or blocked: the entry still counts for this visit.
  }
}

export function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function probe(table, column) {
  try {
    unwrap(await supabase.from(table).select(column).limit(1));
    return true;
  } catch (error) {
    if (isMissingTable(error) || isMissingColumn(error)) return false;
    throw error;
  }
}

export const whatsappService = {
  /** Every bill, lightly, for audiences: who bought, when, how much, what is due. */
  loadInvoices() {
    return withOfflineFallback(
      () => readAll(() => supabase.from("invoices").select(INVOICE_COLUMNS).order("date", { ascending: false })),
      () => db.invoices.reverse().sortBy("date")
    );
  },

  /** Bills since `since` whose items mention the keyword. */
  async invoicesMentioning(keyword, since) {
    const needle = keyword.trim().toLowerCase();
    if (!needle) return [];
    const rows = await readAll(() =>
      supabase
        .from("invoices")
        .select(`${INVOICE_COLUMNS}, products`)
        .gte("date", since)
        .ilike("products", `%${escapeLike(needle)}%`)
        .order("date", { ascending: false })
    );
    return rows.filter((row) => String(row.products ?? "").toLowerCase().includes(needle) && row.date >= since);
  },

  /** Which parts of docs/schema/whatsapp_outbox.sql are in place. */
  async setup() {
    const [log, payLinks, consent] = await Promise.all([
      probe(LOG_TABLE, "id"),
      probe("pay_links", "token"),
      probe("customers", "wa_optin"),
    ]);
    return { log, payLinks, consent };
  },

  /**
   * Sends and skips since `since`. Kept in Supabase once the table exists, in this
   * browser before then; anything saved here first is moved up when the table appears.
   */
  async listLog(since) {
    const local = readLocalLog();
    try {
      if (local.length > 0) {
        unwrap(await supabase.from(LOG_TABLE).upsert(local));
        writeLocalLog([]);
      }
      const entries = await readAll(() =>
        supabase
          .from(LOG_TABLE)
          .select("id, customer_key, phone, template, kind, campaign, status, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
      );
      return { entries, stored: "cloud" };
    } catch (error) {
      if (!isMissingTable(error) && !isNetworkError(error)) throw error;
      const entries = readLocalLog().filter((entry) => entry.created_at >= since);
      return { entries, stored: isMissingTable(error) ? "device" : "offline" };
    }
  },

  async addLog(entry) {
    try {
      unwrap(await supabase.from(LOG_TABLE).insert([entry]));
    } catch (error) {
      if (!isMissingTable(error) && !isNetworkError(error)) throw error;
      writeLocalLog([entry, ...readLocalLog()]);
    }
    return entry;
  },

  async removeLog(id) {
    writeLocalLog(readLocalLog().filter((entry) => entry.id !== id));
    try {
      unwrap(await supabase.from(LOG_TABLE).delete().eq("id", id));
    } catch (error) {
      if (!isMissingTable(error)) throw error;
    }
  },
};
