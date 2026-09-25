import { useCallback, useEffect, useRef, useState } from "react";
import { invoiceService } from "@/services/invoiceService";
import { printCommandService } from "@/services/scannedProductService";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  creditCustomerError,
  normalizePhone,
  paymentsBalance,
  paymentsTotal,
  stockWarningToast,
} from "@/utils/invoice";
import { customerService } from "@/services/customerService";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
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
  const queryClient = useQueryClient();

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

  const blockedByCredit = useCallback(
    (bill) => {
      const message = creditCustomerError(bill);
      if (!message) return false;
      toast({ title: "Customer needed", description: message, variant: "destructive" });
      return true;
    },
    [toast]
  );

  // Credit customers become saved customers so their phone is there next time.
  const rememberCreditCustomer = useCallback(
    async ({ payments, customerName, customerNumber }) => {
      if (toNumber(payments.credit) <= 0 || !isOnline) return;
      const phone = normalizePhone(customerNumber);
      if (customers.some((customer) => normalizePhone(customer.phone) === phone)) return;
      try {
        await customerService.create({ name: customerName.trim(), phone: customerNumber.trim() });
        queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      } catch (error) {
        console.error("Could not save the credit customer:", error);
      }
    },
    [customers, isOnline, queryClient]
  );

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
    if (blockedByCredit(draft)) return;

    // The stored date string is the bill's key; re-formatting it can miss the row.
    const date = draft.editingInvoice.date;
    try {
      const saved = await invoiceService.updateInvoice(date, toPayload(draft, { date }));
      rememberCreditCustomer(draft);
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
  }, [
    draft,
    blockedByCredit,
    rememberCreditCustomer,
    refreshAll,
    loadScannedProducts,
    notifyStock,
    toast,
  ]);

  const printAndSaveInvoice = useCallback(
    async ({ customerName = draft.customerName, customerNumber = draft.customerNumber } = {}) => {
      if (draft.lines.length === 0) {
        toast({
          title: "Nothing to print",
          description: "Add at least one product before generating the invoice.",
          variant: "destructive",
        });
        return;
      }

      // Left blank means the customer owes it all; partly filled is almost always a typo.
      if (!paymentsBalance(draft.payments, draft.total, { allowUnpaid: true })) {
        toast({
          title: "Payments do not match",
          description: `Cash + UPI + Credit (₹${paymentsTotal(draft.payments).toFixed(
            2
          )}) must equal ₹${draft.total}, or be left blank to put it all on credit.`,
          variant: "destructive",
        });
        return;
      }
      const unpaid = paymentsTotal(draft.payments) === 0;
      const bill = {
        ...draft,
        customerName,
        customerNumber,
        payments: unpaid ? { cash: "", upi: "", credit: draft.total } : draft.payments,
      };
      if (blockedByCredit(bill)) return;

      const invoiceId = nextInvoiceId;
      const printed = printDocument(
        <PrintableInvoice
          invoiceId={invoiceId}
          invoiceDate={formatInvoiceDate(new Date())}
          customerName={customerName}
          customerContact={customerNumber}
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
        const saved = await invoiceService.createInvoice(toPayload(bill, { id: invoiceId, date }));
        lastIssuedIdRef.current = invoiceId;
        rememberCreditCustomer(bill);

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
    [
      draft,
      nextInvoiceId,
      blockedByCredit,
      printDocument,
      rememberCreditCustomer,
      refreshAll,
      clearScannedProducts,
      notifyStock,
      toast,
    ]
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
      const { customer_name: customerName, customer_phone: customerNumber } = payload.new ?? {};
      submitRef.current({
        ...(customerName && { customerName }),
        ...(customerNumber && { customerNumber }),
      });
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
