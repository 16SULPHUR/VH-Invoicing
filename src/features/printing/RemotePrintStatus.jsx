import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRINT_JOB_STATUS } from "@/services/printJobService";

export function RemotePrintStatus({ print, invoiceId }) {
  const { job } = print;
  if (!job) {
    const online = print.stations.length > 0;
    return (
      <p className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-destructive"}`}
          aria-hidden
        />
        {online
          ? `Till is open: ${[...new Set(print.stations.map((station) => station.name))].join(", ")}`
          : "No till is open. Remote prints wait until one is."}
      </p>
    );
  }

  if (job.status === PRINT_JOB_STATUS.SAVED) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
        <span className="flex-1 text-sm font-semibold">Bill #{invoiceId} printed at the till</span>
        <Button size="sm" variant="outline" onClick={print.dismiss}>
          Done
        </Button>
      </div>
    );
  }

  if (job.status === PRINT_JOB_STATUS.FAILED) {
    return (
      <div className="rounded-2xl bg-destructive/10 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <XCircle className="h-5 w-5 shrink-0" aria-hidden /> Not printed
        </div>
        <p className="mt-1 text-sm">{job.error}</p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={print.retry}>
            Try again
          </Button>
          <Button size="sm" variant="outline" onClick={print.cancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const claimed = job.status === PRINT_JOB_STATUS.CLAIMED;
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        {claimed ? "Printing at the till…" : "Sent, waiting for the till…"}
      </div>
      {print.unclaimedTooLong && (
        <p className="mt-2 text-sm">
          No till has picked this up. Check the till computer is on with the app open.
        </p>
      )}
      {!claimed && (
        <Button size="sm" variant="outline" className="mt-2" onClick={print.cancel}>
          Cancel
        </Button>
      )}
    </div>
  );
}
