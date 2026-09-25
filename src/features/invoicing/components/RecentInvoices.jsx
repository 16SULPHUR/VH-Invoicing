import { useMemo, useState } from "react";
import { ReceiptText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/EmptyState";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { formatRupees } from "@/utils/formatters";
import { formatDayMonth } from "@/utils/date";
import { usedPaymentMethods } from "../paymentMethods";
import { ICON_STROKE } from "@/config/navigation";

function matchesSearch(invoice, term) {
  if (!term) return true;
  const needle = term.toLowerCase();
  return [invoice.customerName, invoice.id, invoice.total].some((field) =>
    String(field ?? "")
      .toLowerCase()
      .includes(needle)
  );
}

function groupByDay(invoices) {
  const groups = new Map();
  for (const invoice of invoices) {
    const day = formatDayMonth(invoice.date);
    const group = groups.get(day) ?? { invoices: [], totalSale: 0 };
    group.invoices.push(invoice);
    group.totalSale += parseFloat(invoice.total) || 0;
    groups.set(day, group);
  }
  return Array.from(groups.entries());
}

export function RecentInvoices({ invoices, onInvoiceClick }) {
  const [searchTerm, setSearchTerm] = useState("");

  const grouped = useMemo(
    () => groupByDay(invoices.filter((invoice) => matchesSearch(invoice, searchTerm))),
    [invoices, searchTerm]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative px-5 pb-3">
        <Search
          size={15}
          strokeWidth={ICON_STROKE}
          className="pointer-events-none absolute left-8 top-1/2 -translate-y-[calc(50%+0.375rem)] text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search invoices…"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search invoices"
          className="h-10 pl-9"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-5 pb-5">
        {grouped.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={searchTerm ? "No matches" : "No invoices yet"}
            description={
              searchTerm ? "Try a different search." : "Invoices appear here once billed."
            }
          />
        ) : (
          grouped.map(([day, { invoices: dayInvoices, totalSale }]) => (
            <section key={day} className="mb-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="font-display text-base font-bold">{day}</h3>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold tabular-nums">
                  {formatRupees(totalSale)}
                </span>
              </div>

              <ul className="space-y-1.5">
                {dayInvoices.map((invoice) => {
                  const methods = usedPaymentMethods(invoice);
                  const onCredit = Number(invoice.credit) > 0;

                  return (
                    <li key={invoice.id ?? invoice.date}>
                      <button
                        type="button"
                        onClick={() => onInvoiceClick(invoice.date)}
                        className={`press flex w-full items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2 text-left transition-colors ${
                          onCredit
                            ? "border-credit/40 bg-credit/5 hover:bg-credit/10"
                            : "border-border bg-surface hover:border-input"
                        }`}
                      >
                        <span className="w-11 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                          #{invoice.id}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {String(invoice.customerName ?? "").split(" ")[0] || "Walk-in"}
                        </span>
                        {invoice._syncStatus && invoice._syncStatus !== "synced" && (
                          <OfflineBadge syncStatus={invoice._syncStatus} />
                        )}
                        <span className="flex shrink-0 items-center gap-1" aria-hidden>
                          {methods.map(({ key, icon: Icon, text }) => (
                            <Icon key={key} size={13} strokeWidth={ICON_STROKE} className={text} />
                          ))}
                        </span>
                        <span className="shrink-0 font-display text-[15px] font-bold tabular-nums">
                          {formatRupees(invoice.total)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
