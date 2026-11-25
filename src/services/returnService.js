import { supabase, unwrap } from "@/lib/supabase";
import { db } from "@/lib/offline/db";
import { isMissingColumn } from "@/lib/supabaseErrors";

const isMissingFunction = (error) => error?.code === "PGRST202" || error?.code === "42883";

async function callReturnFunction(name, args) {
  const { error, data } = await supabase.rpc(name, args);
  if (error) {
    if (isMissingFunction(error)) {
      throw Object.assign(new Error("Run docs/schema/goods_return_edit.sql in Supabase first."), { code: error.code });
    }
    throw error;
  }
  if (data.invoice?.date) await db.invoices.update(data.invoice.date, { credit: data.invoice.credit });
  return data;
}

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

  /** Changes how a return was refunded, its valid till date and the reason. */
  editReturn(note, { cash, upi, due, expiresOn, reason }) {
    return callReturnFunction("vh_edit_return", {
      p_note_id: note.id,
      p_cash: cash,
      p_upi: upi,
      p_due: due,
      p_expires_on: expiresOn,
      p_note: reason || null,
    });
  },

  /** Cancels a return: stock goes back out, the due goes back on the bill, the books entries go. */
  cancelReturn(note) {
    return callReturnFunction("vh_cancel_return", { p_note_id: note.id });
  },
};
