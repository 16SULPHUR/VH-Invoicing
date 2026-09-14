import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OfflineBadge } from "@/components/common/OfflineBadge";
import { formatAmount } from "@/utils/formatters";
import { formatDayMonth } from "@/utils/date";
import { PAYMENT_ICONS, usedPaymentMethods } from "../paymentMethods";

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

function syncBorderClass(syncStatus) {
  if (syncStatus === "pending") return "border border-dashed border-amber-500/50";
  if (syncStatus === "failed") return "border border-dashed border-red-500/50";
  return "";
}

export function RecentInvoices({ invoices, onInvoiceClick }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredInvoiceId, setHoveredInvoiceId] = useState(null);

  const grouped = useMemo(
    () => groupByDay(invoices.filter((invoice) => matchesSearch(invoice, searchTerm))),
    [invoices, searchTerm]
  );

  return (
    <Card className="h-full w-full border-0 bg-gray-900">
      <CardHeader>
        <Input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="border-gray-700 bg-gray-800 text-white"
        />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(90vh-4rem)] px-2">
          {grouped.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No invoices found.</p>
          )}

          {grouped.map(([day, { invoices: dayInvoices, totalSale }]) => (
            <div key={day} className="mb-4">
              <p className="text-md mb-2 border-b border-gray-700 font-bold text-pink-400">{day}</p>

              {dayInvoices.map((invoice) => {
                const methods = usedPaymentMethods(invoice);
                const isCredit = Number(invoice.credit) > 0;

                return (
                  <div
                    key={invoice.id ?? invoice.date}
                    role="button"
                    tabIndex={0}
                    className={`text-md mb-2 cursor-pointer rounded-md px-2 py-1 shadow-md transition-colors duration-200 ${
                      isCredit
                        ? "bg-red-900/50 hover:bg-red-800"
                        : "bg-pink-900/50 hover:bg-gray-800"
                    } ${syncBorderClass(invoice._syncStatus)}`}
                    onClick={() => onInvoiceClick(invoice.date)}
                    onKeyDown={(event) => event.key === "Enter" && onInvoiceClick(invoice.date)}
                    onMouseEnter={() => setHoveredInvoiceId(invoice.id)}
                    onMouseLeave={() => setHoveredInvoiceId(null)}
                  >
                    <div className="flex items-center justify-between">
                      <h6 className="font-bold text-gray-300">#{invoice.id}</h6>
                      {invoice._syncStatus && invoice._syncStatus !== "synced" && (
                        <OfflineBadge syncStatus={invoice._syncStatus} />
                      )}
                      <h6 className="font-bold text-gray-300">
                        {String(invoice.customerName ?? "—").split(" ")[0]}
                      </h6>
                      <p className="text-md rounded-md bg-pink-400 px-1 font-bold text-gray-900">
                        {methods.map((method) => PAYMENT_ICONS[method]).join("")} ₹ {invoice.total}
                      </p>
                    </div>

                    {methods.length > 1 && hoveredInvoiceId === invoice.id && (
                      <div className="mt-2 flex h-full gap-3 transition-opacity duration-300">
                        {methods.map((method) => (
                          <p
                            key={method}
                            className="text-md rounded-md bg-pink-400 px-1 font-bold text-gray-900"
                          >
                            {PAYMENT_ICONS[method]} ₹ {invoice[method]}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="mt-2 text-right">
                <p className="text-md font-bold text-pink-400">
                  Total Sale: ₹ {formatAmount(totalSale)}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
