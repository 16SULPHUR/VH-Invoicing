import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isPrintQueueMissing, printJobService, PRINT_JOB_STATUS } from "@/services/printJobService";
import { invoiceService } from "@/services/invoiceService";
import { customerService } from "@/services/customerService";
import { queryKeys } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { normalizePhone, parseInvoiceLines, stockWarningToast } from "@/utils/invoice";
import { toNumber } from "@/utils/formatters";
import { formatInvoiceDate } from "@/utils/date";
import { PrintableInvoice } from "@/features/invoicing/components/PrintableInvoice";
import { usePrintDocument } from "@/features/invoicing/hooks/useInvoicePrinting";
import { billFromJob, isFresh, printJobError } from "./printJobBill";
import { PrintStationContext } from "./usePrintStation";
import { loadStationSettings, saveStationSettings } from "./stationSettings";

const RECENT_KEY = ["print-jobs", "recent"];

async function rememberCreditCustomer({ credit, customerName, customerNumber }) {
  if (credit <= 0) return;
  const phone = normalizePhone(customerNumber);
  if (phone.length !== 10) return;
  const customers = await customerService.list();
  if (customers.some((customer) => normalizePhone(customer.phone) === phone)) return;
  await customerService.create({ name: customerName, phone: Number(phone) });
}

export function PrintStationProvider({ children }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printDocument = usePrintDocument();

  const [settings, setSettings] = useState(() => loadStationSettings({ isMobile }));
  const [connected, setConnected] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [queueMissing, setQueueMissing] = useState(false);
  const active = settings.enabled;

  const updateSettings = useCallback((changes) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes };
      saveStationSettings(next);
      return next;
    });
  }, []);

  const recent = useQuery({
    queryKey: RECENT_KEY,
    queryFn: () => printJobService.listRecent(),
    enabled: active,
    retry: false,
  });
  useEffect(() => setQueueMissing(isPrintQueueMissing(recent.error)), [recent.error]);

  const refreshRecent = useCallback(
    () => queryClient.invalidateQueries({ queryKey: RECENT_KEY }),
    [queryClient]
  );

  const printBill = useCallback(
    ({ invoiceId, date, customerName, customerNumber, lines, total, payments, note }) =>
      printDocument(
        <PrintableInvoice
          invoiceId={invoiceId}
          invoiceDate={formatInvoiceDate(date)}
          customerName={customerName}
          customerContact={customerNumber}
          products={lines}
          total={total}
          payments={payments}
          note={note}
        />,
        { frame: true }
      ),
    [printDocument]
  );

  const printSaved = useCallback(
    async (date) => {
      const invoice = await invoiceService.getInvoiceByDate(date);
      printBill({
        invoiceId: invoice.id,
        date: invoice.date,
        customerName: invoice.customerName,
        customerNumber: invoice.customerNumber,
        lines: parseInvoiceLines(invoice.products),
        total: invoice.total,
        payments: { cash: invoice.cash, upi: invoice.upi, credit: invoice.credit },
        note: invoice.note,
      });
      return invoice;
    },
    [printBill]
  );

  const runJob = useCallback(
    async (job) => {
      const claimed = await printJobService.claim(job.id, settings.id).catch(() => null);
      if (!claimed) return;
      setBusyId(job.id);
      try {
        if (claimed.invoice_id) {
          const invoice = await printSaved(claimed.invoice_date);
          await printJobService.markPrinted(claimed.id);
          toast({
            title: `Printing bill #${invoice.id}`,
            description: `Sent from ${claimed.requested_by || "a phone"}.`,
          });
          return;
        }

        const customers = await customerService.list().catch(() => []);
        const problem = printJobError(claimed, customers);
        if (problem) throw new Error(problem);

        const { lines, total, payments, payload } = billFromJob(claimed, customers);
        const result = await printJobService.finish(claimed.id, payload);
        const invoice = result.invoice;

        printBill({
          invoiceId: invoice.id,
          date: invoice.date,
          customerName: payload.customerName,
          customerNumber: payload.customerNumber,
          lines,
          total,
          payments,
          note: payload.note,
        });
        toast({
          title: `Printing bill #${invoice.id}`,
          description: `Sent from ${claimed.requested_by || "a phone"}${
            payload.customerName ? ` for ${payload.customerName}` : ""
          }.`,
        });
        const warning = stockWarningToast(result.stock_failures);
        if (warning) toast(warning);

        rememberCreditCustomer({ ...payload, credit: toNumber(payload.credit) })
          .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }))
          .catch((error) => console.error("Could not save the credit customer:", error));
        [queryKeys.invoices.all, queryKeys.customers.credit, queryKeys.products.all].forEach(
          (queryKey) => queryClient.invalidateQueries({ queryKey })
        );
      } catch (error) {
        await printJobService.fail(claimed.id, error.message).catch(() => {});
        toast({
          title: "Phone bill not printed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
        refreshRecent();
      }
    },
    [settings.id, printBill, printSaved, toast, queryClient, refreshRecent]
  );

  // One job at a time, each at most once per tab.
  const queued = useRef(new Set());
  const chain = useRef(Promise.resolve());
  const enqueue = useCallback(
    (job) => {
      if (queued.current.has(job.id)) return;
      queued.current.add(job.id);
      chain.current = chain.current
        .then(() => runJob(job))
        .finally(() => queued.current.delete(job.id));
    },
    [runJob]
  );

  const pickUpOpenJobs = useCallback(async () => {
    try {
      const open = await printJobService.listOpen();
      open.filter(isFresh).forEach(enqueue);
      setQueueMissing(false);
    } catch (error) {
      if (isPrintQueueMissing(error)) setQueueMissing(true);
    }
    refreshRecent();
  }, [enqueue, refreshRecent]);

  useEffect(() => {
    if (!active) return undefined;
    pickUpOpenJobs();
    const stop = printJobService.subscribe((payload) => {
      if (payload.eventType === "SUBSCRIBED") {
        setConnected(true);
        pickUpOpenJobs();
        return;
      }
      refreshRecent();
      const job = payload.new;
      if (job?.status === PRINT_JOB_STATUS.PENDING && isFresh(job)) {
        enqueue(job);
      }
    });
    // Realtime can drop quietly while the computer sleeps; look again when it wakes.
    const recheck = () => document.visibilityState === "visible" && pickUpOpenJobs();
    const poll = setInterval(pickUpOpenJobs, 30 * 1000);
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("online", recheck);
    return () => {
      stop();
      setConnected(false);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("online", recheck);
    };
  }, [active, enqueue, pickUpOpenJobs, refreshRecent]);

  useEffect(() => {
    if (!active) return undefined;
    return printJobService.announceStation({ id: settings.id, name: settings.name });
  }, [active, settings.id, settings.name]);

  const printNow = useCallback(
    async (job) => {
      if (job.status === PRINT_JOB_STATUS.FAILED) await printJobService.retry(job.id);
      enqueue({ ...job, status: PRINT_JOB_STATUS.PENDING });
    },
    [enqueue]
  );

  const discard = useCallback(
    async (job) => {
      await printJobService.cancel(job.id);
      refreshRecent();
    },
    [refreshRecent]
  );

  const reprint = useCallback(
    async (job) => {
      try {
        await printSaved(job.invoice_date);
      } catch (error) {
        toast({ title: "Could not reprint", description: error.message, variant: "destructive" });
      }
    },
    [printSaved, toast]
  );

  const testPrint = useCallback(
    () =>
      printBill({
        invoiceId: "TEST",
        date: new Date(),
        customerName: "Test print",
        customerNumber: "",
        lines: [{ name: "Printer check", quantity: 1, price: 0, amount: 0 }],
        total: 0,
        payments: { cash: 0, upi: 0, credit: 0 },
        note: "Phone printing is set up on this computer.",
      }),
    [printBill]
  );

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      active,
      connected: active && connected,
      queueMissing,
      busyId,
      jobs: recent.data ?? [],
      printNow,
      discard,
      reprint,
      testPrint,
    }),
    [
      settings,
      updateSettings,
      active,
      connected,
      queueMissing,
      busyId,
      recent.data,
      printNow,
      discard,
      reprint,
      testPrint,
    ]
  );

  return <PrintStationContext.Provider value={value}>{children}</PrintStationContext.Provider>;
}
