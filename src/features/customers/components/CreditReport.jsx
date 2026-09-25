import { useState } from "react";
import { FileDown, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceEditDialog } from "@/features/invoicing/components/InvoiceEditDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Monogram } from "@/components/common/Monogram";
import { PageLoader } from "@/components/common/PageLoader";
import { StatTile } from "@/components/common/StatTile";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatDateDDMMMYYYY, toISODate } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { useCreditReport } from "../hooks/useCreditReport";

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
  const [editingInvoice, setEditingInvoice] = useState(null);

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
            placeholder="Search by customer name…"
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

      {report.isLoading ? (
        <PageLoader label="Loading credit report…" />
      ) : report.customers.length === 0 ? (
        <EmptyState title="No outstanding credit" description="Bills with a credit amount show up here." />
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {report.customers.map((customer) => (
            <AccordionItem
              key={customer.key}
              value={customer.key}
              className="overflow-hidden rounded-2xl border-0 bg-surface shadow-[0_1px_0_hsl(var(--border))] data-[state=open]:ring-2 data-[state=open]:ring-marigold"
            >
              <AccordionTrigger className="gap-3 py-2.5 pl-2.5 pr-4 hover:no-underline">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Monogram name={customer.customerName} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{customer.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.invoices.length} bill{customer.invoices.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <span className="ml-auto font-display text-lg font-extrabold tabular-nums text-credit">
                    {formatRupees(customer.totalCredit)}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-3 pt-0 sm:pl-[3.9rem]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-dashed hover:bg-transparent">
                      <TableHead className="h-8 px-2">Bill</TableHead>
                      <TableHead className="h-8 px-2">Date</TableHead>
                      <TableHead className="h-8 px-2 text-right">Total</TableHead>
                      <TableHead className="h-8 px-2 text-right">Credit</TableHead>
                      <TableHead className="hidden h-8 px-2 text-right sm:table-cell">Paid</TableHead>
                      <TableHead className="h-8 w-14 px-2" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-dashed">
                        <TableCell className="px-2 py-2 font-bold">#{invoice.id}</TableCell>
                        <TableCell className="whitespace-nowrap px-2 py-2">
                          {formatDateDDMMMYYYY(invoice.date)}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right tabular-nums">
                          {formatRupees(invoice.total)}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right font-bold tabular-nums text-credit">
                          {formatRupees(invoice.credit)}
                        </TableCell>
                        <TableCell className="hidden px-2 py-2 text-right tabular-nums text-success sm:table-cell">
                          {formatRupees(invoice.total - invoice.credit)}
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingInvoice(invoice)}
                            className="press h-7 px-2 font-bold text-rani hover:bg-accent hover:text-rani"
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <InvoiceEditDialog
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSaved={report.refresh}
      />
    </div>
  );
}
