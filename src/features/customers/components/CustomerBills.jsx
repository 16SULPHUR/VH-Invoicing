import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PAYMENT_METHODS } from "@/features/invoicing/paymentMethods";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { invoiceItemCount, parseInvoiceLines } from "@/utils/invoice";

export function CustomerBills({ invoices, onEdit }) {
  if (invoices.length === 0) {
    return <EmptyState title="No bills yet" description="Bills with this name or phone show up here." />;
  }

  return (
    <ul className="divide-y divide-dashed divide-border overflow-hidden rounded-2xl bg-surface shadow-[0_1px_0_hsl(var(--border))]">
      {invoices.map((invoice) => {
        const due = Number(invoice.credit) || 0;
        const items = invoiceItemCount(parseInvoiceLines(invoice.products));
        return (
          <li key={invoice.date} className="flex items-center gap-3 px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">#{invoice.id}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateDDMMMYYYY(invoice.date)} · {items} item{items === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {PAYMENT_METHODS.filter(({ key }) => Number(invoice[key]) > 0).map(({ key, label, text, tint }) => (
                  <span key={key} className={`rounded-full border px-2 py-px text-[11px] font-bold tabular-nums ${tint} ${text}`}>
                    {label} {formatRupees(invoice[key])}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-base font-extrabold tabular-nums">{formatRupees(invoice.total)}</div>
              {due > 0 ? (
                <div className="text-xs font-bold tabular-nums text-credit">{formatRupees(due)} due</div>
              ) : (
                <div className="inline-flex items-center gap-0.5 text-xs font-bold text-success">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Paid
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(invoice)}
              aria-label={`Edit bill ${invoice.id}`}
              className="press h-9 w-9 shrink-0 p-0 text-rani hover:bg-accent hover:text-rani"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
