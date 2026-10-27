import { useMemo, useState } from "react";
import { Banknote, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { allocatePayment } from "../lib/allocatePayment";
import { daysSince, todayLocal } from "../lib/customerKey";
import { useRecordPayment } from "../hooks/useCreditPayments";

const METHODS = [
  { key: "cash", label: "Cash", icon: Banknote, on: "border-cash bg-cash/10 text-cash" },
  { key: "upi", label: "UPI", icon: Smartphone, on: "border-upi bg-upi/10 text-upi" },
];

const wholeRupees = (value) => Math.max(0, Math.floor(Number(value) || 0));

function RowStatus({ amount, left }) {
  if (amount > 0 && left === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
        <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Paid
      </span>
    );
  }
  if (amount > 0) {
    return (
      <span className="rounded-full bg-marigold/20 px-2 py-0.5 text-[11px] font-bold text-warning">
        Part paid · {formatRupees(left)} left
      </span>
    );
  }
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Open</span>;
}

/** Takes money against one customer's credit bills, oldest first, with per-bill control. */
export function CollectPayment({ invoices }) {
  const recordPayment = useRecordPayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [paidOn, setPaidOn] = useState(todayLocal);
  const [note, setNote] = useState("");
  const [skipped, setSkipped] = useState(() => new Set());
  const [manual, setManual] = useState(null);

  const totalDue = invoices.reduce((sum, invoice) => sum + wholeRupees(invoice.credit), 0);
  const selected = useMemo(
    () => new Set(invoices.map((invoice) => invoice.date).filter((date) => !skipped.has(date))),
    [invoices, skipped]
  );

  const rows = useMemo(() => {
    const auto = allocatePayment(invoices, amount, selected);
    if (!manual) return auto;
    return auto.map((row) => {
      const applied = Math.min(row.due, wholeRupees(manual[row.invoice.date]));
      return { ...row, amount: applied, left: row.due - applied };
    });
  }, [invoices, amount, selected, manual]);

  const collecting = rows.reduce((sum, row) => sum + row.amount, 0);
  const typed = wholeRupees(amount);
  const extra = manual ? 0 : Math.max(0, typed - collecting);
  const billsTouched = rows.filter((row) => row.amount > 0).length;

  const quickAmounts = [...new Set([totalDue, rows[0]?.due, 500, 1000, 2000])]
    .filter((value) => value > 0 && value <= totalDue)
    .slice(0, 4);

  const typeAmount = (value) => {
    setAmount(value);
    setManual(null);
  };

  const editRow = (date, value) => {
    setManual(Object.fromEntries(rows.map((row) => [row.invoice.date, row.amount])));
    setManual((current) => ({ ...current, [date]: value }));
  };

  const toggleRow = (date) => {
    setManual(null);
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const allocations = rows
      .filter((row) => row.amount > 0)
      .map(({ invoice, amount: applied }) => ({ invoice, amount: applied }));
    if (allocations.length === 0) return;
    recordPayment.mutate(
      { allocations, method, paidOn, note: note.trim() },
      {
        onSuccess: () => {
          setAmount("");
          setManual(null);
          setNote("");
          setSkipped(new Set());
        },
      }
    );
  };

  const amountShown = manual ? String(collecting) : amount;

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
      <div className="rounded-3xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
        <label htmlFor="collect-amount" className="eyebrow">
          Amount received
        </label>
        <div className="mt-1 flex items-baseline gap-1 border-b-[1.5px] border-dashed border-border pb-2 focus-within:border-rani">
          <span className="font-display text-3xl font-extrabold text-muted-foreground">₹</span>
          <input
            id="collect-amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={amountShown}
            onChange={(event) => typeAmount(event.target.value.replace(/\D/g, ""))}
            className="w-full min-w-0 bg-transparent font-display text-5xl font-extrabold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => typeAmount(String(value))}
              className={`press rounded-full border-[1.5px] px-3 py-1 text-xs font-bold tabular-nums transition-colors ${
                !manual && typed === value
                  ? "border-indigo bg-indigo text-white"
                  : "border-border hover:border-indigo/40"
              }`}
            >
              {value === totalDue ? `All due · ${formatRupees(value)}` : formatRupees(value)}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {METHODS.map(({ key, label, icon: Icon, on }) => (
            <button
              key={key}
              type="button"
              aria-pressed={method === key}
              onClick={() => setMethod(key)}
              className={`press flex h-12 items-center justify-center gap-2 rounded-2xl border-[1.5px] font-display text-base font-bold transition-colors ${
                method === key ? on : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <p className="eyebrow">Goes against</p>
          <p className="text-xs text-muted-foreground">Oldest first · edit any amount</p>
        </div>
        <ul className="divide-y divide-dashed divide-border overflow-hidden rounded-2xl bg-surface shadow-[0_1px_0_hsl(var(--border))]">
          {rows.map(({ invoice, amount: applied, due, left }) => {
            const age = daysSince(invoice.date);
            const included = selected.has(invoice.date);
            return (
              <li key={invoice.date} className={`flex items-center gap-3 px-3 py-2.5 ${included ? "" : "opacity-50"}`}>
                <input
                  type="checkbox"
                  checked={included}
                  onChange={() => toggleRow(invoice.date)}
                  aria-label={`Include bill ${invoice.id}`}
                  className="h-4 w-4 shrink-0 accent-[hsl(var(--rani))]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-bold">#{invoice.id}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateDDMMMYYYY(invoice.date)}
                      {age > 0 && ` · ${age}d`}
                    </span>
                    <RowStatus amount={applied} left={left} />
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">Due {formatRupees(due)}</p>
                </div>
                <div className="flex w-28 shrink-0 items-baseline gap-0.5 rounded-xl border-[1.5px] border-border bg-surface-elevated px-2.5 py-1.5 focus-within:border-rani/50">
                  <span className="text-sm font-bold text-muted-foreground">₹</span>
                  <input
                    inputMode="numeric"
                    aria-label={`Amount for bill ${invoice.id}`}
                    disabled={!included}
                    value={applied || ""}
                    placeholder="0"
                    onChange={(event) => editRow(invoice.date, event.target.value.replace(/\D/g, ""))}
                    className="w-full min-w-0 bg-transparent text-right font-display text-base font-bold tabular-nums outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Note (optional)"
          aria-label="Payment note"
        />
        <Input
          type="date"
          value={paidOn}
          max={todayLocal()}
          onChange={(event) => setPaidOn(event.target.value)}
          aria-label="Paid on"
          className="w-40"
        />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-auto border-t-[1.5px] border-border bg-background/95 px-5 pb-5 pt-3 backdrop-blur">
        <p className="mb-2 text-sm text-muted-foreground">
          {collecting > 0 ? (
            <>
              <b className="text-foreground">{formatRupees(collecting)}</b> across {billsTouched} bill
              {billsTouched === 1 ? "" : "s"} · <b className="text-credit">{formatRupees(totalDue - collecting)}</b> still due
            </>
          ) : (
            "Type an amount or pick one above."
          )}
          {extra > 0 && <span className="block text-warning">{formatRupees(extra)} is more than the selected bills owe.</span>}
        </p>
        <Button
          type="submit"
          variant="rani"
          size="lg"
          disabled={collecting === 0 || recordPayment.isPending}
          className="block-shadow h-14 w-full rounded-2xl font-display text-lg font-extrabold"
        >
          {recordPayment.isPending
            ? "Recording…"
            : `Record ${formatRupees(collecting)} ${method === "upi" ? "UPI" : "cash"}`}
        </Button>
      </div>
    </form>
  );
}
