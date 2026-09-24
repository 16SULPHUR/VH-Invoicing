import { useCallback, useEffect, useState } from "react";
import { invoiceService } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { paymentsBalance, paymentsTotal } from "@/utils/invoice";
import { toNumber } from "@/utils/formatters";
import { formatInvoiceDate } from "@/utils/date";
import { PrintableInvoice } from "../components/PrintableInvoice";
import { useInvoiceDraft } from "./useInvoiceDraft";
import { usePrintDocument } from "./useInvoicePrinting";
import { useScannedProducts } from "./useScannedProducts";
import {
  useCustomerDirectory,
  useDailySales,
  useInvalidateInvoiceData,
  useProductCatalog,
  useRecentInvoices,
  useSalesSummary,
} from "./useInvoiceQueries";

function toPayload(draft, { id, date }) {
  return {
    ...(id === undefined ? {} : { id }),
    customerName: draft.customerName,
    customerNumber: draft.customerNumber,
    products: JSON.stringify(draft.lines),
    total: draft.total,
    cash: toNumber(draft.payments.cash),
    upi: toNumber(draft.payments.upi),
    credit: toNumber(draft.payments.credit),
    note: draft.note,
    date,
  };
}

/**
 * Single source of truth for the invoicing screen. Both the desktop and mobile
 * layouts render from this; they differ only in how they arrange the panels.
 */
export function useInvoiceWorkspace() {
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const printDocument = usePrintDocument();
  const invalidateInvoices = useInvalidateInvoiceData();

  const draft = useInvoiceDraft();
  const { data: catalog } = useProductCatalog();
  const { data: customers } = useCustomerDirectory();
  const { data: dailySales } = useDailySales();
  const recentInvoices = useRecentInvoices();
  const sales = useSalesSummary();

  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { clearScannedProducts } = useScannedProducts({
    catalog,
    setLines: draft.setLines,
    enabled: catalog.length > 0,
  });

  const refreshAll = useCallback(() => {
    invalidateInvoices();
    sales.refetchSummary();
  }, [invalidateInvoices, sales]);

  const openInvoice = useCallback(
    async (invoiceDate) => {
      try {
        setSelectedInvoice(await invoiceService.getInvoiceByDate(invoiceDate));
      } catch (error) {
        toast({
          title: "Error",
          description: `Could not open invoice: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const deleteInvoice = useCallback(
    async (invoiceDate) => {
      try {
        await invoiceService.deleteInvoice(invoiceDate);
        setSelectedInvoice(null);
        refreshAll();
        toast({ title: "Invoice deleted", description: "Stock has been restored." });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete invoice: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [refreshAll, toast]
  );

  const editInvoice = useCallback(
    (invoice) => {
      draft.loadInvoice(invoice);
      setSelectedInvoice(null);
    },
    [draft]
  );

  const updateInvoice = useCallback(async () => {
    if (!paymentsBalance(draft.payments, draft.total)) {
      toast({
        title: "Payments do not match",
        description: `Cash + UPI + Credit must equal ₹${draft.total}.`,
        variant: "destructive",
      });
      return;
    }

    const date = draft.currentDate.toISOString();
    try {
      const saved = await invoiceService.updateInvoice(date, toPayload(draft, { date }));
      refreshAll();
      draft.reset();

      const synced = saved?._syncStatus === "synced";
      toast({
        title: synced ? "Invoice updated" : "Saved offline",
        description: synced
          ? "The invoice has been updated."
          : "Invoice update saved offline. It will sync when you are back online.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update invoice: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [draft, refreshAll, toast]);

  const printAndSaveInvoice = useCallback(async () => {
    if (draft.lines.length === 0) {
      toast({
        title: "Nothing to print",
        description: "Add at least one product before generating the invoice.",
        variant: "destructive",
      });
      return;
    }

    // An unpaid invoice is allowed; a partially-filled one is almost always a typo.
    if (!paymentsBalance(draft.payments, draft.total, { allowUnpaid: true })) {
      toast({
        title: "Payments do not match",
        description: `Cash + UPI + Credit (₹${paymentsTotal(draft.payments).toFixed(
          2
        )}) must equal ₹${draft.total}, or be left blank.`,
        variant: "destructive",
      });
      return;
    }

    const invoiceId = recentInvoices.nextInvoiceId;
    const printed = printDocument(
      <PrintableInvoice
        invoiceId={invoiceId}
        invoiceDate={formatInvoiceDate(new Date())}
        customerName={draft.customerName}
        customerContact={draft.customerNumber}
        products={draft.lines}
        total={draft.total}
      />
    );

    if (!printed) {
      toast({
        title: "Print blocked",
        description: "Allow pop-ups for this site to print invoices.",
        variant: "destructive",
      });
    }

    const date = new Date().toISOString();
    try {
      const saved = await invoiceService.createInvoice(toPayload(draft, { id: invoiceId, date }));

      if (saved._syncStatus === "pending") {
        toast({
          title: "Saved offline",
          description: "Invoice saved offline. It will sync when you are back online.",
        });
      }

      refreshAll();
      draft.reset();
      await clearScannedProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save invoice: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [draft, recentInvoices.nextInvoiceId, printDocument, refreshAll, clearScannedProducts, toast]);

  const submitInvoice = draft.isEditing ? updateInvoice : printAndSaveInvoice;

  // F1 is the till's "print bill" key.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "F1") return;
      event.preventDefault();
      submitInvoice();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitInvoice]);

  return {
    draft,
    catalog,
    customers,
    dailySales,
    recentInvoices,
    sales,
    isOnline,
    selectedInvoice,
    closeInvoice: () => setSelectedInvoice(null),
    openInvoice,
    editInvoice,
    deleteInvoice,
    submitInvoice,
  };
}
