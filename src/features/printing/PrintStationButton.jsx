import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ICON_STROKE } from "@/config/navigation";
import { PRINT_JOB_STATUS } from "@/services/printJobService";
import { formatRupees } from "@/utils/formatters";
import { invoiceTotal } from "@/utils/invoice";
import { usePrintStation } from "./usePrintStation";
import { isFresh, jobLines } from "./printJobBill";

const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

function jobLabel(job, busyId) {
  if (job.id === busyId) return { text: "Printing now", tone: "text-marigold" };
  switch (job.status) {
    case PRINT_JOB_STATUS.SAVED:
      return { text: `Bill #${job.invoice_id}`, tone: "text-success" };
    case PRINT_JOB_STATUS.FAILED:
      return { text: job.error || "Failed", tone: "text-destructive" };
    case PRINT_JOB_STATUS.CANCELLED:
      return { text: "Cancelled", tone: "text-muted-foreground" };
    case PRINT_JOB_STATUS.CLAIMED:
      return { text: "Printing at another till", tone: "text-marigold" };
    default:
      return isFresh(job)
        ? { text: "Waiting", tone: "text-marigold" }
        : { text: "Waiting for you to print", tone: "text-destructive" };
  }
}

function JobRow({ job, station }) {
  const { text, tone } = jobLabel(job, station.busyId);
  const waiting = job.status === PRINT_JOB_STATUS.PENDING || job.status === PRINT_JOB_STATUS.FAILED;
  const lines = jobLines(job);

  return (
    <li className="rounded-2xl border-[1.5px] border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-semibold">{job.customer_name || "Walk-in"}</span>
        <span className="shrink-0 font-display font-extrabold">
          {formatRupees(invoiceTotal(lines))}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        {timeFormatter.format(new Date(job.created_at))} · {lines.length} item
        {lines.length === 1 ? "" : "s"} · {job.payment_mode.toUpperCase()} ·{" "}
        {job.requested_by || "Phone"}
      </div>
      <div className={`mt-1 text-sm font-semibold ${tone}`}>{text}</div>
      {(waiting || job.status === PRINT_JOB_STATUS.SAVED) && job.id !== station.busyId && (
        <div className="mt-2 flex gap-2">
          {waiting ? (
            <>
              <Button size="sm" onClick={() => station.printNow(job)}>
                Print now
              </Button>
              <Button size="sm" variant="outline" onClick={() => station.discard(job)}>
                Discard
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => station.reprint(job)}>
              Reprint
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

/** Sidebar chip for this computer's phone-printing state, opening its settings and queue. */
export function PrintStationButton() {
  const station = usePrintStation();
  const [open, setOpen] = useState(false);
  if (!station) return null;

  const waiting = station.jobs.filter(
    (job) => job.status === PRINT_JOB_STATUS.PENDING || job.status === PRINT_JOB_STATUS.FAILED
  ).length;
  const dot = !station.active
    ? "bg-white/40"
    : station.queueMissing || !station.connected
      ? "bg-destructive"
      : waiting
        ? "bg-marigold"
        : "bg-emerald-400";
  const label = !station.active
    ? "Phone printing off"
    : station.queueMissing
      ? "Phone printing needs setup"
      : !station.connected
        ? "Phone printing connecting"
        : waiting
          ? `${waiting} phone bill${waiting === 1 ? "" : "s"} waiting`
          : "Printing phone bills";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium text-indigo-foreground transition-colors hover:bg-white/10"
      >
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
        <span className="truncate">{label}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 font-display text-xl font-extrabold">
              <Printer size={20} strokeWidth={ICON_STROKE} aria-hidden /> Phone printing
            </SheetTitle>
            <SheetDescription>
              Bills sent from the Scan screen on a phone are saved and printed here.
            </SheetDescription>
          </SheetHeader>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3">
            <span>
              <span className="block font-semibold">Print phone bills on this computer</span>
              <span className="text-xs text-muted-foreground">
                Turn this off on computers without the bill printer.
              </span>
            </span>
            <Switch
              checked={station.settings.enabled}
              onCheckedChange={(enabled) => station.updateSettings({ enabled })}
            />
          </label>

          {station.active && (
            <>
              <label className="grid gap-1 text-sm font-semibold">
                Name shown on the phone
                <Input
                  value={station.settings.name}
                  onChange={(event) =>
                    station.updateSettings({ name: event.target.value || "Till" })
                  }
                  className="bg-surface"
                />
              </label>

              {station.queueMissing && (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  The print queue isn&apos;t in the database yet. Run docs/schema/print_jobs.sql in
                  Supabase.
                </p>
              )}

              <div className="rounded-2xl border-[1.5px] border-dashed border-border px-4 py-3 text-sm">
                <p className="font-semibold">Print without clicking</p>
                <p className="mt-1 text-muted-foreground">
                  Browsers ask before printing. To print phone bills straight away, open the till
                  from a Chrome shortcut with{" "}
                  <code className="rounded bg-secondary px-1">--kiosk-printing</code> added to its
                  target, with the bill printer as the default printer. Keep the till open in its
                  own window.
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={station.testPrint}>
                  Test print
                </Button>
              </div>

              <div>
                <h3 className="mb-2 font-display font-extrabold">Recent phone bills</h3>
                {station.jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing sent from a phone yet.</p>
                ) : (
                  <ul className="grid gap-2">
                    {station.jobs.map((job) => (
                      <JobRow key={job.id} job={job} station={station} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
