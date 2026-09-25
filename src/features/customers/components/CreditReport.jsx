import { useMemo, useState } from "react";
import { ChevronRight, FileDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { Monogram } from "@/components/common/Monogram";
import { PageLoader } from "@/components/common/PageLoader";
import { StatTile } from "@/components/common/StatTile";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatDateDDMMMYYYY, toISODate } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { useCreditReport } from "../hooks/useCreditReport";
import { daysSince } from "../lib/customerKey";
import { CustomerSheet } from "./CustomerSheet";

const SORTS = [
  { value: "due", label: "Most due" },
  { value: "oldest", label: "Waiting longest" },
  { value: "recent", label: "Recent" },
];

const SORTERS = {
  due: (a, b) => b.totalCredit - a.totalCredit,
  oldest: (a, b) => String(a.invoices.at(-1).date).localeCompare(String(b.invoices.at(-1).date)),
  recent: (a, b) => String(b.invoices[0].date).localeCompare(String(a.invoices[0].date)),
};

const CSV_HEADERS = [
  "Customer Name",
  "Invoice ID",
  "Date",
  "Total Amount",
  "Credit Amount",
  "Paid Amount",
  "Payment Status",
];

export default function CreditReport() {
  const report = useCreditReport();
  const [openCustomer, setOpenCustomer] = useState(null);
  const [sort, setSort] = useState("due");
  const customers = useMemo(() => [...report.customers].sort(SORTERS[sort]), [report.customers, sort]);

  const summaryTiles = [
    { title: "Customers with credit", value: report.summary.totalCustomers },
    { title: "Credit bills", value: report.summary.totalInvoices },
  ];

  const exportToCsv = () => {
    const rows = report.customers.flatMap((customer) =>
      customer.invoices.map((invoice) => [
        customer.customerName,
        invoice.id,
        formatDateDDMMMYYYY(invoice.date),
        invoice.total,
        invoice.credit,
        invoice.total - invoice.credit,
        invoice.paymentStatus ?? "",
      ])
    );
    downloadCsv(`credit_report_${toISODate()}.csv`, toCsv(CSV_HEADERS, rows));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search by name or phone…"
            value={report.searchTerm}
            onChange={(event) => report.setSearchTerm(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={exportToCsv}
          className="press ml-auto"
          disabled={report.isLoading || report.customers.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="motif-overlay col-span-2 rounded-2xl bg-marigold px-4 py-3.5 text-marigold-foreground sm:col-span-1">
          <p className="eyebrow relative text-marigold-foreground/75">Total credit outstanding</p>
          <p className="relative mt-1.5 font-display text-3xl font-extrabold tabular-nums leading-none tracking-tight">
            {formatRupees(report.summary.totalCredit)}
          </p>
        </div>
        {summaryTiles.map(({ title, value }) => (
          <StatTile key={title} label={title} value={value} />
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="eyebrow mr-1">Sort</span>
        {SORTS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSort(value)}
            className={`press rounded-full border-[1.5px] px-3 py-1 text-xs font-bold transition-colors ${
              sort === value ? "border-indigo bg-indigo text-white" : "border-border hover:border-indigo/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {report.isLoading ? (
        <PageLoader label="Loading credit report…" />
      ) : customers.length === 0 ? (
        <EmptyState title="No outstanding credit" description="Bills with a credit amount show up here." />
      ) : (
        <ul className="space-y-2">
          {customers.map((customer) => {
            const oldest = customer.invoices[customer.invoices.length - 1];
            const age = daysSince(oldest.date);
            return (
              <li key={customer.key}>
                <button
                  type="button"
                  onClick={() => setOpenCustomer({ name: customer.customerName, phone: customer.customerNumber })}
                  className="press flex w-full items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-4 text-left shadow-[0_1px_0_hsl(var(--border))] transition-shadow hover:ring-2 hover:ring-marigold"
                >
                  <Monogram name={customer.customerName} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{customer.customerName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {customer.invoices.length} bill{customer.invoices.length === 1 ? "" : "s"}
                      {customer.customerNumber && ` · ${customer.customerNumber}`}
                    </div>
                  </div>
                  <span
                    className={`hidden rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline ${
                      age > 60 ? "bg-credit/10 text-credit" : age > 30 ? "bg-marigold/20 text-warning" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {age === 0 ? "Today" : `Oldest ${age}d`}
                  </span>
                  <span className="w-24 text-right font-display text-lg font-extrabold tabular-nums text-credit">
                    {formatRupees(customer.totalCredit)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <CustomerSheet customer={openCustomer} initialTab="collect" onClose={() => setOpenCustomer(null)} />
    </div>
  );
}
