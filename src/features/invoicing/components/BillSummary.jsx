import { formatRupees, toNumber } from "@/utils/formatters";
import { usedPaymentMethods } from "../paymentMethods";

/** A bill as a phone-sized receipt: what was sold, the price agreed, and how it was paid. */
export function BillSummary({ lines, invoice }) {
  const tagTotal = lines.reduce(
    (sum, line) => sum + toNumber(line.mrp ?? line.price) * toNumber(line.quantity),
    0
  );
  const saved = tagTotal - toNumber(invoice.total);

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-3">
      <ul className="divide-y divide-border">
        {lines.map((line, index) => (
          <li key={`${line.name}-${index}`} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{line.name}</div>
              <div className="text-xs tabular-nums text-muted-foreground">
                {line.quantity} × {line.mrp > line.price && <s>{formatRupees(line.mrp)} </s>}
                {formatRupees(line.price)}
              </div>
            </div>
            <div className="shrink-0 font-display font-bold tabular-nums">{formatRupees(line.amount)}</div>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-border pt-2 text-sm">
        {saved > 0.5 && (
          <div className="flex justify-between text-success">
            <dt>Price agreed, saved</dt>
            <dd className="font-bold tabular-nums">{formatRupees(saved)}</dd>
          </div>
        )}
        <div className="flex justify-between font-display text-lg font-extrabold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatRupees(invoice.total)}</dd>
        </div>
        {usedPaymentMethods(invoice).map(({ key, label, text }) => (
          <div key={key} className="flex justify-between">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={`font-bold tabular-nums ${text}`}>{formatRupees(invoice[key])}</dd>
          </div>
        ))}
        {invoice.note && <div className="pt-1 text-xs text-muted-foreground">Note: {invoice.note}</div>}
      </dl>
    </div>
  );
}
