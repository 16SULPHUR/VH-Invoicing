import { ReceiptText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { financialYearOptions } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { usedPaymentMethods } from "../paymentMethods";
import { RecentInvoices } from "./RecentInvoices";
import { ICON_STROKE } from "@/config/navigation";

/** Sheet with every bill for the chosen financial year, searchable. */
export function RecentBillsSheet({ recentInvoices, onInvoiceClick, trigger }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0 px-5 pb-3 pt-5 text-left">
          <SheetTitle className="font-display text-2xl font-extrabold">Bills</SheetTitle>
          <select
            id="financial-year"
            aria-label="Financial year"
            value={recentInvoices.financialYear}
            onChange={(event) => recentInvoices.setFinancialYear(event.target.value)}
            className="mr-8 h-9 rounded-full border-[1.5px] border-border bg-surface px-3 text-sm font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {financialYearOptions().map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
        </SheetHeader>
        <div className="min-h-0 flex-1">
          <RecentInvoices invoices={recentInvoices.invoices} onInvoiceClick={onInvoiceClick} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The last few bills, under the Print button. */
export function RecentBillsStrip({ recentInvoices, onInvoiceClick, count = 3 }) {
  const latest = recentInvoices.invoices.slice(0, count);

  return (
    <section className="grid gap-1">
      <div className="flex items-center justify-between">
        <h2 className="eyebrow font-sans">Recent bills</h2>
        <RecentBillsSheet
          recentInvoices={recentInvoices}
          onInvoiceClick={onInvoiceClick}
          trigger={
            <button type="button" className="press text-xs font-bold text-rani hover:underline">
              See all
            </button>
          }
        />
      </div>
      {latest.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No bills yet this year.</p>
      ) : (
        <ul>
          {latest.map((invoice) => {
            const [method] = usedPaymentMethods(invoice);
            return (
              <li key={invoice.id ?? invoice.date} className="border-t border-dashed border-border">
                <button
                  type="button"
                  onClick={() => onInvoiceClick(invoice.date)}
                  className="press flex w-full items-center gap-2 py-2 text-left text-[13px] hover:text-rani"
                >
                  <span className="font-bold tabular-nums">#{invoice.id}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {String(invoice.customerName ?? "").split(" ")[0] || "Walk-in"}
                  </span>
                  {method && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${method.tint} ${method.text} border-0`}>
                      {method.label}
                    </span>
                  )}
                  <span className="w-16 text-right font-bold tabular-nums">
                    {formatRupees(invoice.total)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function RecentBillsButton({ recentInvoices, onInvoiceClick, onDark = false }) {
  return (
    <RecentBillsSheet
      recentInvoices={recentInvoices}
      onInvoiceClick={onInvoiceClick}
      trigger={
        <button
          type="button"
          aria-label="Recent bills"
          className={`press inline-flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] ${
            onDark ? "border-white/25 text-white hover:bg-white/10" : "border-border bg-surface hover:border-input"
          }`}
        >
          <ReceiptText size={16} strokeWidth={ICON_STROKE} aria-hidden />
        </button>
      }
    />
  );
}
