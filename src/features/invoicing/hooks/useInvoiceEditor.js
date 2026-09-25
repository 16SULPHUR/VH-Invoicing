import { useCallback, useEffect } from "react";
import { invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { toNumber } from "@/utils/formatters";
import { paymentsBalance, stockWarningToast } from "@/utils/invoice";
import { useInvoiceDraft } from "./useInvoiceDraft";

/**
 * Edits one existing invoice in isolation. Used wherever an invoice needs
 * correcting outside the main till — currently the customer credit report.
 */
export function useInvoiceEditor({ invoice, onSaved }) {
  const { toast } = useToast();
  const draft = useInvoiceDraft();
  const { loadInvoice, reset } = draft;

  useEffect(() => {
    if (invoice) loadInvoice(invoice);
    else reset();
  }, [invoice, loadInvoice, reset]);

  const save = useCallback(async () => {
    if (!paymentsBalance(draft.payments, draft.total)) {
      toast({
        title: "Payments do not match",
        description: `Cash + UPI + Credit must equal ₹${draft.total}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const saved = await invoiceService.updateInvoice(invoice.date, {
        customerName: draft.customerName,
        customerNumber: draft.customerNumber,
        products: JSON.stringify(draft.lines),
        total: draft.total,
        cash: toNumber(draft.payments.cash),
        upi: toNumber(draft.payments.upi),
        credit: toNumber(draft.payments.credit),
        note: draft.note,
        date: invoice.date,
      });

      toast({ title: "Invoice updated" });
      const warning = stockWarningToast(saved?.stockFailures);
      if (warning) toast(warning);
      onSaved?.();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [draft, invoice, onSaved, toast]);

  return { draft, save };
}
