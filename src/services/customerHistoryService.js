import { supabase, unwrap } from "@/lib/supabase";
import { db } from "@/lib/offline/db";
import { withOfflineFallback } from "@/lib/offline/network";
import { customerKey, invoiceCustomerKey, phoneDigits } from "@/features/customers/lib/customerKey";

const escapeLike = (text) => text.replace(/[%_\\]/g, (char) => `\\${char}`);

export const customerHistoryService = {
  /** Every bill for one customer, newest first. Matched loosely on the server, exactly here. */
  listInvoices(customer) {
    const key = customerKey(customer);
    const belongs = (invoice) => invoiceCustomerKey(invoice) === key;

    return withOfflineFallback(
      async () => {
        const digits = phoneDigits(customer.phone);
        const query = supabase.from("invoices").select("*");
        const rows = unwrap(
          await (digits.length === 10
            ? query.ilike("customerNumber", `%${digits.slice(-4)}%`)
            : query.ilike("customerName", `%${escapeLike(String(customer.name ?? "").trim())}%`)
          ).order("date", { ascending: false })
        );
        return (rows || []).filter(belongs);
      },
      async () => (await db.invoices.reverse().sortBy("date")).filter(belongs)
    );
  },
};
