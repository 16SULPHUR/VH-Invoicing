import { useCallback, useEffect, useState } from "react";
import { isPrintQueueMissing, printJobService, PRINT_JOB_STATUS } from "@/services/printJobService";
import { printCommandService } from "@/services/scannedProductService";
import { creditCustomerError } from "@/utils/invoice";
import { useToast } from "@/hooks/use-toast";

const JOB_KEY = "vh-phone-print-job";
const POLL_MS = 3000;
export const NO_TILL_AFTER_MS = 15 * 1000;

const OPEN = new Set([PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.CLAIMED]);

function storedJobId() {
  try {
    return localStorage.getItem(JOB_KEY);
  } catch {
    return null;
  }
}

function storeJobId(id) {
  try {
    if (id) localStorage.setItem(JOB_KEY, id);
    else localStorage.removeItem(JOB_KEY);
  } catch {
    // Tracking just won't survive a reload.
  }
}

// Until print_jobs.sql is run: the till prints its own screen and saves it on credit.
async function sendTheOldWay(input, toast) {
  const problem = creditCustomerError({
    payments: { credit: 1 },
    customerName: input.customer_name,
    customerNumber: input.customer_phone,
  });
  if (problem) {
    toast({ title: "Customer needed", description: problem, variant: "destructive" });
    return null;
  }
  try {
    await printCommandService.requestPrint({
      customerName: input.customer_name,
      customerPhone: input.customer_phone,
    });
    toast({ title: "Print sent", description: "Sent the old way. Check the till printed it." });
    return true;
  } catch (error) {
    toast({
      title: "Could not send to the till",
      description: error.message,
      variant: "destructive",
    });
    return null;
  }
}

/** Sends the scan list to a till as a print job and follows it until it is printed. */
export function usePhonePrint() {
  const { toast } = useToast();
  const [stations, setStations] = useState([]);
  const [job, setJob] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [sentAt, setSentAt] = useState(Date.now());

  useEffect(() => printJobService.watchStations(setStations), []);

  useEffect(() => {
    const id = storedJobId();
    if (id) printJobService.get(id).then(setJob, () => storeJobId(null));
  }, []);

  const jobId = job?.id;
  const isOpen = job ? OPEN.has(job.status) : false;

  // Realtime for speed, polling because phones drop sockets when the screen dims.
  useEffect(() => {
    if (!jobId || !isOpen) return undefined;
    const refresh = () => printJobService.get(jobId).then(setJob, () => {});
    const stop = printJobService.subscribe(
      (payload) => (payload.new?.id ? setJob(payload.new) : refresh()),
      { id: jobId }
    );
    const poll = setInterval(() => {
      setNow(Date.now());
      refresh();
    }, POLL_MS);
    return () => {
      stop();
      clearInterval(poll);
    };
  }, [jobId, isOpen]);

  const send = useCallback(
    async (input) => {
      setIsSending(true);
      try {
        const created = await printJobService.create({ ...input, requested_by: "Phone" });
        storeJobId(created.id);
        setSentAt(Date.now());
        setJob(created);
        return created;
      } catch (error) {
        if (isPrintQueueMissing(error)) return sendTheOldWay(input, toast);
        toast({
          title: "Could not send to the till",
          description: error.message,
          variant: "destructive",
        });
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [toast]
  );

  const cancel = useCallback(async () => {
    if (!jobId) return;
    const cancelled = await printJobService.cancel(jobId).catch(() => false);
    if (!cancelled) {
      toast({
        title: "Too late to cancel",
        description: "The till is already printing this bill.",
      });
      return;
    }
    storeJobId(null);
    setJob(null);
  }, [jobId, toast]);

  const retry = useCallback(async () => {
    if (!jobId) return;
    await printJobService.retry(jobId);
    setSentAt(Date.now());
    setJob((previous) => ({ ...previous, status: PRINT_JOB_STATUS.PENDING, error: null }));
  }, [jobId]);

  const dismiss = useCallback(() => {
    storeJobId(null);
    setJob(null);
  }, []);

  const unclaimedTooLong =
    job?.status === PRINT_JOB_STATUS.PENDING && now - sentAt > NO_TILL_AFTER_MS;

  return { stations, job, isOpen, isSending, unclaimedTooLong, send, cancel, retry, dismiss };
}
