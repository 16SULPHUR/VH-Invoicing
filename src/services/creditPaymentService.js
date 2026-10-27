import { supabase, unwrap } from "@/lib/supabase";
import { db } from "@/lib/offline/db";
import { phoneDigits } from "@/features/customers/lib/customerKey";

const TABLE = "credit_payments";

// invoices.cash, upi and credit are whole-rupee bigint columns.
const rupees = (value) => Math.round(Number(value) || 0);

export const creditPaymentService = {
  async listForCustomer({ name, phone }) {
    const digits = phoneDigits(phone);
    let query = supabase.from(TABLE).select();
    query =
      digits.length === 10
        ? query.eq("customer_phone", digits)
        : query.is("customer_phone", null).ilike("customer_name", String(name ?? "").trim());
    return (
      unwrap(
        await query
          .order("paid_on", { ascending: false })
          .order("created_at", { ascending: false })
      ) || []
    );
  },

  /** Records one payment per allocation and moves that amount from credit to the chosen method. */
  async record({ allocations, method, paidOn, note }) {
    for (const { invoice, amount } of allocations) {
      const [payment] = unwrap(
        await supabase
          .from(TABLE)
          .insert([
            {
              invoice_id: invoice.id,
              invoice_date: invoice.date,
              customer_name: String(invoice.customerName ?? "").trim(),
              customer_phone: phoneDigits(invoice.customerNumber).length === 10 ? phoneDigits(invoice.customerNumber) : null,
              amount: rupees(amount),
              method,
              paid_on: paidOn,
              note: note || null,
            },
          ])
          .select()
      );

      const changes = {
        credit: rupees(invoice.credit) - rupees(amount),
        [method]: rupees(invoice[method]) + rupees(amount),
      };
      const { error } = await supabase.from("invoices").update(changes).eq("date", invoice.date);
      if (error) {
        await supabase.from(TABLE).delete().eq("id", payment.id);
        throw error;
      }
      await db.invoices.update(invoice.date, changes);
    }
  },
};
