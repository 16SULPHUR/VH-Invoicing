import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Printer, TriangleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";
import { formatRupees, toNumber } from "@/utils/formatters";
import { formatInvoiceDate } from "@/utils/date";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { Chips } from "@/features/counter/components/Chips";
import { MoneyInput, TextArea } from "@/features/counter/components/Bits";
import { usePrintSlip } from "@/features/counter/hooks/usePrintSlip";
import { EXPIRY_CHOICES } from "@/features/counter/lib/credit";
import { creditNoteSlip } from "@/features/counter/lib/slips";
import { addDays, todayLocal } from "@/features/counter/lib/shopTools";
import { useNonSalePatterns, useReturnGoods } from "../hooks/useBillReturns";
import { daysSince, returnableLines, returnTotal, suggestRefund } from "../lib/returnMath";

const PRESETS = [
  { value: "usual", label: "Off the due, rest cash" },
  { value: "cash", label: "All cash" },
  { value: "upi", label: "All UPI" },
  { value: "credit", label: "All store credit" },
];

function QuantityStepper({ value, max, onChange, label }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <Button type="button" variant="outline" size="icon" className="press h-8 w-8" disabled={value <= 0} onClick={() => onChange(value - 1)} aria-label="One less">
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </Button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{value}</span>
      <Button type="button" variant="outline" size="icon" className="press h-8 w-8" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="One more">
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  );
}

/** Pick what is coming back from a bill, how it is refunded, and print the credit note. */
export function ReturnSheet({ open, invoice, notes, onClose, onReturned }) {
  const { toast } = useToast();
  const { isOnline: online } = useOnlineStatus();
  const { settings } = useShopSettings();
  const nonSale = useNonSalePatterns();
  const printSlip = usePrintSlip();
  const returnGoods = useReturnGoods(invoice);

  const [quantities, setQuantities] = useState({});
  const [skipStock, setSkipStock] = useState({});
  const [refund, setRefund] = useState({ cash: 0, upi: 0, due: 0 });
  const [touched, setTouched] = useState(false);
  const [expiry, setExpiry] = useState(90);
  const [note, setNote] = useState("");
  const [acceptLate, setAcceptLate] = useState(false);

  const lines = useMemo(() => (invoice ? returnableLines(invoice, notes, nonSale) : []), [invoice, notes, nonSale]);
  const goods = lines.filter((line) => line.goods);
  const stillDue = Math.max(0, toNumber(invoice?.credit));
  const total = returnTotal(lines, quantities);
  const amount = Math.round(total);

  useEffect(() => {
    if (!open) return;
    setQuantities({});
    setSkipStock({});
    setRefund({ cash: 0, upi: 0, due: 0 });
    setTouched(false);
    setExpiry(90);
    setNote("");
    setAcceptLate(false);
  }, [open, invoice?.date]);

  useEffect(() => {
    if (!touched) setRefund(suggestRefund(amount, stillDue));
  }, [amount, stillDue, touched]);

  if (!invoice) return null;

  const store = amount - refund.cash - refund.upi - refund.due;
  const windowDays = Math.floor(toNumber(settings.exchange_days));
  const age = daysSince(invoice.date);
  const late = windowDays > 0 && age > windowDays;
  const allBack = goods.length > 0 && goods.every((line) => (quantities[line.index] ?? 0) === line.left);

  const setQuantity = (line, value) => setQuantities((previous) => ({ ...previous, [line.index]: Math.max(0, Math.min(line.left, value)) }));
  const setRefundField = (key, value) => {
    setTouched(true);
    setRefund((previous) => ({ ...previous, [key]: key === "due" ? Math.min(value, stillDue) : value }));
  };

  const applyPreset = (preset) => {
    setTouched(true);
    if (preset === "usual") setRefund(suggestRefund(amount, stillDue));
    else if (preset === "cash") setRefund({ cash: amount, upi: 0, due: 0 });
    else if (preset === "upi") setRefund({ cash: 0, upi: amount, due: 0 });
    else setRefund({ cash: 0, upi: 0, due: 0 });
  };

  const error = !online
    ? "You are offline. Returns need a connection."
    : store < 0
      ? `The refunds add up to ${formatRupees(-store)} more than the goods.`
      : late && !acceptLate
        ? "Tick “Accept anyway” to return after the exchange window."
        : null;

  const submit = async () => {
    const picked = goods
      .filter((line) => (quantities[line.index] ?? 0) > 0)
      .map((line) => ({ index: line.index, quantity: quantities[line.index], restock: !skipStock[line.index] }));
    try {
      const result = await returnGoods.mutateAsync({
        lines: picked,
        cash: refund.cash,
        upi: refund.upi,
        due: refund.due,
        expiresOn: store > 0 && expiry ? addDays(todayLocal(), expiry) : null,
        note: note.trim(),
      });
      printSlip(creditNoteSlip(result.note));
      toast({ title: `Credit note ${result.note.token} for ${formatRupees(result.note.amount)}`, description: "The bill is unchanged. The return is in the reports and books." });
      onReturned?.(result);
      onClose();
    } catch {
      // the mutation already told the user
    }
  };

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={`Return from bill #${invoice.id}`}
      description={`${invoice.customerName || "Walk-in"} · ${formatInvoiceDate(invoice.date)}`}
      footer={
        <>
          {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
          <Button className="press block-shadow w-full" disabled={amount <= 0 || Boolean(error) || returnGoods.isPending} onClick={submit}>
            <Printer className="h-4 w-4" aria-hidden /> {returnGoods.isPending ? "Saving…" : `Return ${formatRupees(amount)} and print`}
          </Button>
        </>
      }
    >
      {late && (
        <label className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span className="flex-1">
            This bill is {age} days old. The exchange window is {windowDays} days.
          </span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Checkbox checked={acceptLate} onCheckedChange={(value) => setAcceptLate(value === true)} /> Accept anyway
          </span>
        </label>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">What is coming back</p>
          {goods.some((line) => line.left > 0) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="press"
              onClick={() => setQuantities(allBack ? {} : Object.fromEntries(goods.map((line) => [line.index, line.left])))}
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden /> {allBack ? "Clear" : "Return whole bill"}
            </Button>
          )}
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {goods.map((line) => {
            const value = quantities[line.index] ?? 0;
            return (
              <li key={line.index} className={cn("space-y-1.5 px-3 py-2.5", line.left === 0 && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatRupees(Math.round(line.unit))} each · sold {line.sold}
                      {line.returned > 0 && ` · ${line.returned} already returned`}
                    </p>
                  </div>
                  {line.left > 0 ? (
                    <QuantityStepper value={value} max={line.left} onChange={(next) => setQuantity(line, next)} label={`Quantity of ${line.name}`} />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">All returned</span>
                  )}
                </div>
                {value > 0 && (
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox checked={!skipStock[line.index]} onCheckedChange={(next) => setSkipStock((previous) => ({ ...previous, [line.index]: next !== true }))} />
                    Put back in stock <span className="text-muted-foreground">(untick if damaged)</span>
                  </label>
                )}
              </li>
            );
          })}
          {goods.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground">This bill has no goods lines that can be returned.</li>}
        </ul>
      </section>

      {amount > 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-base font-bold">Refund</p>
            <p className="font-display text-xl font-extrabold tabular-nums">{formatRupees(amount)}</p>
          </div>
          <Chips label="Quick refund" value={null} onChange={applyPreset} options={PRESETS} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cash back" htmlFor="return-cash">
              <MoneyInput id="return-cash" value={refund.cash} onChange={(value) => setRefundField("cash", value)} />
            </Field>
            <Field label="UPI back" htmlFor="return-upi">
              <MoneyInput id="return-upi" value={refund.upi} onChange={(value) => setRefundField("upi", value)} />
            </Field>
            <Field label="Off the bill's due" htmlFor="return-due" hint={stillDue > 0 ? `${formatRupees(stillDue)} still due on this bill` : "Nothing is due on this bill"}>
              <MoneyInput id="return-due" value={refund.due} onChange={(value) => setRefundField("due", value)} disabled={stillDue === 0} />
            </Field>
            <Field label="Store credit" htmlFor="return-credit" hint="Whatever is left over">
              <MoneyInput id="return-credit" value={Math.max(0, store)} onChange={() => {}} readOnly />
            </Field>
          </div>
          {store > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Store credit valid for</p>
              <Chips label="Valid for" value={expiry} onChange={setExpiry} options={EXPIRY_CHOICES} />
            </div>
          )}
          <Field label="Reason" htmlFor="return-note">
            <TextArea id="return-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Colour did not suit, size, fault…" />
          </Field>
        </section>
      )}
    </ToolSheet>
  );
}
