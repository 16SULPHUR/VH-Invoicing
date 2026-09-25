import { useCallback, useEffect, useRef, useState } from "react";
import { invoiceService } from "@/services/invoiceService";
import { printCommandService } from "@/services/scannedProductService";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { paymentsBalance, paymentsTotal, stockWarningToast } from "@/utils/invoice";
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
export function useInvoiceWorkspace({ acceptRemotePrint = false } = {}) {
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const printDocument = usePrintDocument();
  const invalidateInvoices = useInvalidateInvoiceData();

  const draft = useInvoiceDraft({ persistKey: "vh-till-draft" });
  const { data: catalog } = useProductCatalog();
  const { data: customers } = useCustomerDirectory();
  const { data: dailySales } = useDailySales();
  const recentInvoices = useRecentInvoices();
  const sales = useSalesSummary();

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const lastIssuedIdRef = useRef(null);

  const { loadScannedProducts, clearScannedProducts } = useScannedProducts({
    catalog,
    setLines: draft.setLines,
    enabled: catalog.length > 0,
    paused: draft.isEditing,
  });

  // The invoice list refetches after a save; until it does, don't hand out the same number again.
  const lastIssued = lastIssuedIdRef.current;
  const nextInvoiceId =
    lastIssued !== null && lastIssued >= recentInvoices.nextInvoiceId
      ? lastIssued + 1
      : recentInvoices.nextInvoiceId;

  const notifyStock = useCallback(
    (failures) => {
      const warning = stockWarningToast(failures);
      if (warning) toast(warning);
    },
    [toast]
  );

  // One bill at a time: a second F1 or tap while saving would save it twice.
  const runExclusive = useCallback(async (task) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await task();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

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
        const result = await invoiceService.deleteInvoice(invoiceDate);
        setSelectedInvoice(null);
        refreshAll();
        toast({ title: "Invoice deleted", description: "Stock has been restored." });
        notifyStock(result?.stockFailures);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete invoice: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [refreshAll, notifyStock, toast]
  );

  const editInvoice = useCallback(
    (invoice) => {
      draft.loadInvoice(invoice);
      setSelectedInvoice(null);
    },
    [draft]
  );

  const cancelEdit = useCallback(() => {
    draft.reset();
    loadScannedProducts();
  }, [draft, loadScannedProducts]);

  const updateInvoice = useCallback(async () => {
    if (!paymentsBalance(draft.payments, draft.total)) {
      toast({
        title: "Payments do not match",
        description: `Cash + UPI + Credit must equal ₹${draft.total}.`,
        variant: "destructive",
      });
      return;
    }

    // The stored date string is the bill's key; re-formatting it can miss the row.
    const date = draft.editingInvoice.date;
    try {
      const saved = await invoiceService.updateInvoice(date, toPayload(draft, { date }));
      refreshAll();
      draft.reset();
      loadScannedProducts();
      notifyStock(saved?.stockFailures);

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
  }, [draft, refreshAll, loadScannedProducts, notifyStock, toast]);

  const printAndSaveInvoice = useCallback(
    async ({ customerName = draft.customerName } = {}) => {
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

      const invoiceId = nextInvoiceId;
      const printed = printDocument(
        <PrintableInvoice
          invoiceId={invoiceId}
          invoiceDate={formatInvoiceDate(new Date())}
          customerName={customerName}
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
        const saved = await invoiceService.createInvoice(
          toPayload({ ...draft, customerName }, { id: invoiceId, date })
        );
        lastIssuedIdRef.current = invoiceId;

        if (saved._syncStatus === "pending") {
          toast({
            title: "Saved offline",
            description: "Invoice saved offline. It will sync when you are back online.",
          });
        }

        draft.reset();
        await clearScannedProducts();
        refreshAll();
        notifyStock(saved.stockFailures);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to save invoice: ${error.message}`,
          variant: "destructive",
        });
      }
    },
    [draft, nextInvoiceId, printDocument, refreshAll, clearScannedProducts, notifyStock, toast]
  );

  const submitInvoice = useCallback(
    (options) =>
      runExclusive(() => (draft.isEditing ? updateInvoice() : printAndSaveInvoice(options))),
    [draft.isEditing, updateInvoice, printAndSaveInvoice, runExclusive]
  );

  // The phone's Print button asks the till to print whatever has been scanned.
  const submitRef = useRef(submitInvoice);
  submitRef.current = submitInvoice;
  const isEditingRef = useRef(draft.isEditing);
  isEditingRef.current = draft.isEditing;
  useEffect(() => {
    if (!acceptRemotePrint) return undefined;
    return printCommandService.subscribe((payload) => {
      if (payload?.eventType !== "INSERT") return;
      if (isEditingRef.current) {
        toast({
          title: "Print from phone ignored",
          description: "Finish or cancel the bill you are editing, then print again.",
          variant: "destructive",
        });
        return;
      }
      const customerName = payload.new?.customer_name;
      submitRef.current(customerName ? { customerName } : undefined);
    });
  }, [acceptRemotePrint, toast]);

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
    nextInvoiceId,
    displayedInvoiceId: draft.editingInvoice
      ? draft.editingInvoice._offlineId
        ? draft.editingInvoice._printedId
        : draft.editingInvoice.id
      : nextInvoiceId,
    sales,
    isOnline,
    selectedInvoice,
    closeInvoice: () => setSelectedInvoice(null),
    openInvoice,
    editInvoice,
    deleteInvoice,
    submitInvoice,
    cancelEdit,
    isSubmitting,
  };
}
