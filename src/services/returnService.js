import { supabase, unwrap } from "@/lib/supabase";
import { db } from "@/lib/offline/db";
import { isMissingColumn } from "@/lib/supabaseErrors";

const isMissingFunction = (error) => error?.code === "PGRST202" || error?.code === "42883";

export const returnService = {
  /** Return notes for one bill, oldest first. Empty until goods_return.sql has been run. */
  async listForInvoice(invoice) {
    try {
      return (
        unwrap(
          await supabase
            .from("credit_notes")
            .select("*")
            .eq("source_bill", invoice.id)
            .eq("source_invoice_date", invoice.date)
            .neq("status", "void")
            .order("created_at", { ascending: true })
        ) || []
      );
    } catch (error) {
      if (isMissingColumn(error)) return [];
      throw error;
    }
  },

  /** Saves the return, restocks, and lowers the bill's due, all in one transaction. */
  async returnGoods(invoice, { lines, cash, upi, due, expiresOn, note }) {
    const { error, data } = await supabase.rpc("vh_return_goods", {
      p_invoice_date: invoice.date,
      p_lines: lines,
      p_cash: cash,
      p_upi: upi,
      p_due: due,
      p_expires_on: expiresOn,
      p_note: note || null,
    });
    if (error) {
      if (isMissingFunction(error)) {
        throw Object.assign(new Error("Run docs/schema/goods_return.sql in Supabase first."), { code: error.code });
      }
      throw error;
    }
    if (data.invoice?.date) await db.invoices.update(data.invoice.date, { credit: data.invoice.credit });
    return data;
  },
};
