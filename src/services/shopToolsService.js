import { supabase, unwrap } from "@/lib/supabase";
import { isMissingColumn, isMissingTable } from "@/lib/supabaseErrors";

const PAGE = 1000;

// Everything docs/schema/shop_tools.sql creates; the tools stay off until all of it exists.
export const SHOP_TOOL_TABLES = [
  "service_jobs",
  "approvals",
  "bookings",
  "credit_notes",
  "stock_counts",
  "stock_count_scans",
  "stock_moves",
];

async function readAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(await build().range(from, from + PAGE - 1)) || [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

const isMissingFunction = (error) => error?.code === "PGRST202" || error?.code === "42883";

/** The save was refused because another device changed the record first. */
export const isStale = (error) => error?.code === "40001";

export const shopToolsService = {
  /** Which tables are missing; an empty list means shop_tools.sql has been run. */
  async setup() {
    const results = await Promise.all(
      SHOP_TOOL_TABLES.map(async (table) => {
        try {
          unwrap(await supabase.from(table).select("id").limit(1));
          return null;
        } catch (error) {
          if (isMissingTable(error) || isMissingColumn(error)) return table;
          throw error;
        }
      })
    );
    return { missing: results.filter(Boolean) };
  },

  list(table) {
    return readAll(() => supabase.from(table).select("*").order("created_at", { ascending: false }));
  },

  /**
   * Saves one record and its stock changes in one go. `version` must be the version the
   * record was read at; a newer one on the server makes the save fail with isStale.
   */
  async save(table, row, { id = null, version = null, moves = [], reason = null } = {}) {
    try {
      return unwrap(
        await supabase.rpc("vh_tool_save", {
          p_table: table,
          p_id: id,
          p_version: version,
          p_row: row,
          p_moves: moves.filter((move) => move.product_id && move.delta),
          p_reason: reason,
        })
      );
    } catch (error) {
      if (isMissingFunction(error)) {
        throw Object.assign(new Error("Run docs/schema/shop_tools.sql in Supabase first."), { code: error.code });
      }
      throw error;
    }
  },

  /** Puts pieces into the shared scan list; the till turns each row into a bill line. */
  async sendToTill(lines) {
    const rows = lines
      .filter((line) => line.barcode && line.quantity > 0)
      .map((line) => ({ name: String(line.barcode), quantity: line.quantity, price: line.price || 0 }));
    if (rows.length === 0) return 0;
    unwrap(await supabase.from("scanned_products").insert(rows));
    return rows.length;
  },

  async invoice(id) {
    return unwrap(
      await supabase
        .from("invoices")
        .select("id, date, customerName, customerNumber, products, total")
        .eq("id", id)
        .maybeSingle()
    );
  },

  /** Bill lines since `since`, for when each product last sold. */
  soldSince(since) {
    return readAll(() =>
      supabase.from("invoices").select("id, date, products").gte("date", since).order("date", { ascending: false })
    );
  },

  listScans(countId) {
    return readAll(() =>
      supabase
        .from("stock_count_scans")
        .select("id, code, product_id, quantity, created_at")
        .eq("count_id", countId)
        .order("created_at", { ascending: false })
    );
  },

  async addScan(scan) {
    return unwrap(await supabase.from("stock_count_scans").insert([scan]).select())?.[0] ?? scan;
  },

  async removeScan(id) {
    return unwrap(await supabase.from("stock_count_scans").delete().eq("id", id));
  },
};
