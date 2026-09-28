import { supabase, unwrap } from "@/lib/supabase";
import { isMissingTable } from "@/lib/supabaseErrors";

const PAGE = 1000;

/** Local calendar dates to exact timestamptz bounds, so a bill at 00:30 IST lands on its own day. */
export function rangeBounds({ from, to } = {}) {
  return {
    start: from ? new Date(`${from}T00:00:00`).toISOString() : null,
    end: to ? new Date(new Date(`${to}T00:00:00`).getTime() + 86_400_000 - 1).toISOString() : null,
  };
}

function bounded(query, range, column) {
  const { start, end } = rangeBounds(range);
  let next = query;
  if (start) next = next.gte(column, start);
  if (end) next = next.lte(column, end);
  return next;
}

async function fetchAll(build) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = unwrap(await build().range(offset, offset + PAGE - 1)) || [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export const reportService = {
  bills(range) {
    return fetchAll(() =>
      bounded(
        supabase.from("invoices").select('id, date, "customerName", "customerNumber", products, total, cash, upi, credit'),
        range,
        "date"
      ).order("date", { ascending: true })
    );
  },

  products() {
    return fetchAll(() =>
      supabase.from("products").select('id, name, barcode, quantity, cost, "sellingPrice", supplier, created_at').order("id")
    );
  },

  async suppliers() {
    return unwrap(await supabase.from("suppliers").select("id, name, code")) || [];
  },

  async collections(range) {
    try {
      let query = supabase.from("credit_payments").select("invoice_id, invoice_date, customer_name, amount, method, paid_on");
      if (range?.from) query = query.gte("paid_on", range.from);
      if (range?.to) query = query.lte("paid_on", range.to);
      return unwrap(await query) || [];
    } catch (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
  },

  async creditNotes(range) {
    try {
      return unwrap(await bounded(supabase.from("credit_notes").select("token, customer_name, amount, status, lines, created_at"), range, "created_at")) || [];
    } catch (error) {
      if (isMissingTable(error)) return [];
      throw error;
    }
  },

  async ledgerGst(range) {
    const rows = await fetchAll(() =>
      bounded(supabase.from("ledger_view").select("credit, debit").eq("account_name", "GST Output"), range, "date")
    );
    return rows.reduce((sum, row) => sum + (Number(row.credit) || 0) - (Number(row.debit) || 0), 0);
  },
};

const PATTERNS = "non_sale_line_patterns";

/** Returns null while the shared table does not exist, so callers fall back to their own list. */
export const nonSalePatternService = {
  async list() {
    try {
      return (unwrap(await supabase.from(PATTERNS).select("pattern")) || []).map((row) => row.pattern);
    } catch (error) {
      if (isMissingTable(error)) return null;
      throw error;
    }
  },
  async add(pattern) {
    unwrap(await supabase.from(PATTERNS).insert([{ pattern }]));
  },
  async remove(pattern) {
    unwrap(await supabase.from(PATTERNS).delete().eq("pattern", pattern));
  },
};
