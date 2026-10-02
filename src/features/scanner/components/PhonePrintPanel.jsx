import { useMemo } from "react";
import { CheckCircle2, Loader2, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { phoneDigits } from "@/features/customers/lib/customerKey";
import { formatRupees } from "@/utils/formatters";
import { PRINT_JOB_STATUS } from "@/services/printJobService";
import { PAYMENT_MODES } from "@/features/printing/printJobBill";

function TillStatus({ stations }) {
  const online = stations.length > 0;
  const names = [...new Set(stations.map((station) => station.name))].join(", ");
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <span
        className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-destructive"}`}
        aria-hidden
      />
      {online
        ? `Printing at ${names}`
        : "No till is open for printing. Bills will wait until one is."}
    </div>
  );
}

function JobStatus({ print }) {
  const { job, unclaimedTooLong } = print;
  const who = job.customer_name || "Walk-in";

  if (job.status === PRINT_JOB_STATUS.SAVED) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-success/10 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Bill #{job.invoice_id} printed</div>
          <div className="truncate text-xs text-muted-foreground">
            {who} · {job.payment_mode.toUpperCase()}
          </div>
        </div>
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
      <div className="flex items-center gap-2 font-semibold">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
        {claimed ? "Printing at the till…" : "Sent, waiting for the till…"}
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">{who}</div>
      {unclaimedTooLong && (
        <p className="mt-2 text-sm">
          No till has picked this up. Check the till computer is on with the app open, or cancel and
          bill it at the till.
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

function useCustomerSuggestions(name, phone) {
  const { data: customers = [] } = useCustomers();
  return useMemo(() => {
    const byName = name.trim().toLowerCase();
    const byPhone = phoneDigits(phone);
    if (byName.length < 2 && byPhone.length < 3) return [];
    return customers
      .filter((customer) => {
        const digits = phoneDigits(customer.phone);
        const matchesName = byName.length >= 2 && customer.name?.toLowerCase().includes(byName);
        const matchesPhone = byPhone.length >= 3 && digits.includes(byPhone);
        const alreadyChosen = digits === byPhone && customer.name?.trim() === name.trim();
        return (matchesName || matchesPhone) && !alreadyChosen;
      })
      .slice(0, 4);
  }, [customers, name, phone]);
}

export function PhonePrintPanel({
  print,
  items,
  customerName,
  customerPhone,
  note,
  paymentMode,
  onCustomerName,
  onCustomerPhone,
  onNote,
  onPaymentMode,
  onPrint,
}) {
  const suggestions = useCustomerSuggestions(customerName, customerPhone);
  if (print.job && print.isOpen) return <JobStatus print={print} />;

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pieces = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="space-y-2">
      {print.job && <JobStatus print={print} />}
      <TillStatus stations={print.stations} />
      <div className="flex w-full flex-wrap gap-2">
        <Input
          type="text"
          value={customerName}
          onChange={(event) => onCustomerName(event.target.value)}
          placeholder={paymentMode === "credit" ? "Customer name (needed)" : "Customer name"}
          autoComplete="off"
          className="min-w-[9rem] flex-1 bg-surface"
        />
        <Input
          type="tel"
          inputMode="tel"
          value={customerPhone}
          onChange={(event) => onCustomerPhone(event.target.value)}
          placeholder={paymentMode === "credit" ? "Phone (needed)" : "Phone"}
          autoComplete="off"
          className="w-36 bg-surface"
        />
      </div>
      {suggestions.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {suggestions.map((customer) => (
            <li key={`${customer.name}-${customer.phone}`}>
              <button
                type="button"
                onClick={() => {
                  onCustomerName(customer.name || "");
                  onCustomerPhone(phoneDigits(customer.phone));
                }}
                className="press flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
              >
                <span className="truncate font-semibold">{customer.name}</span>
                <span className="tabular-nums text-muted-foreground">{phoneDigits(customer.phone)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        type="text"
        value={note}
        onChange={(event) => onNote(event.target.value)}
        placeholder="Note on the bill (optional)"
        maxLength={200}
        className="bg-surface"
      />
      {items.length > 0 && (
        <div className="flex items-baseline justify-between rounded-xl bg-secondary px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} · {pieces} pcs
          </span>
          <span className="font-display text-xl font-extrabold tabular-nums">{formatRupees(total)}</span>
        </div>
      )}
      <div className="flex gap-2">
        <div
          role="radiogroup"
          aria-label="Payment"
          className="flex flex-1 gap-1 rounded-full bg-secondary p-1"
        >
          {PAYMENT_MODES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={paymentMode === value}
              onClick={() => onPaymentMode(value)}
              className={`press flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                paymentMode === value ? "bg-rani text-rani-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button onClick={onPrint} disabled={print.isSending} className="block-shadow h-10">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>
    </div>
  );
}
