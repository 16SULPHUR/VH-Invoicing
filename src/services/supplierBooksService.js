import { supabase, unwrap } from "@/lib/supabase";
import { isMissingColumn, isMissingTable } from "@/lib/supabaseErrors";

const PAGE = 1000;

async function readAll(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const page = unwrap(await build().range(from, from + PAGE - 1)) || [];
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

export const supplierBooksService = {
  /** False until docs/schema/supplier_invoices.sql has been run. */
  async isReady() {
    try {
      unwrap(await supabase.from("supplier_bills").select("id").limit(1));
      unwrap(await supabase.from("supplier_payments").select("id").limit(1));
      unwrap(await supabase.from("suppliers").select("id, gstin, credit_days").limit(1));
      return true;
    } catch (error) {
      if (isMissingTable(error) || isMissingColumn(error)) return false;
      throw error;
    }
  },

  async load() {
    const [bills, payments] = await Promise.all([
      readAll(() => supabase.from("supplier_bills").select("*").order("bill_date", { ascending: false })),
      readAll(() => supabase.from("supplier_payments").select("*").order("paid_on").order("created_at")),
    ]);
    return { bills, payments };
  },

  async saveBill(bill) {
    const { id, ...fields } = bill;
    const query = id
      ? supabase.from("supplier_bills").update(fields).eq("id", id)
      : supabase.from("supplier_bills").insert(fields);
    const [saved] = unwrap(await query.select());
    return saved;
  },

  async deleteBill(id) {
    return unwrap(await supabase.from("supplier_bills").delete().eq("id", id));
  },

  async addPayments(rows) {
    return unwrap(await supabase.from("supplier_payments").insert(rows).select());
  },

  async deletePayment(id) {
    return unwrap(await supabase.from("supplier_payments").delete().eq("id", id));
  },

  async markStockReceived(id) {
    return unwrap(
      await supabase.from("supplier_bills").update({ stock_received_at: new Date().toISOString() }).eq("id", id)
    );
  },
};
