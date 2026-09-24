import { useState } from "react";
import { FileDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceEditDialog } from "@/features/invoicing/components/InvoiceEditDialog";
import { PageLoader } from "@/components/common/PageLoader";
import { StatTile } from "@/components/common/StatTile";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatDateDDMMMYYYY, toISODate } from "@/utils/date";
import { formatAmount } from "@/utils/formatters";
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
    { title: "Total Credit", value: `₹${formatAmount(report.summary.totalCredit)}` },
    { title: "Customers with Credit", value: report.summary.totalCustomers },
    { title: "Total Credit Invoices", value: report.summary.totalInvoices },
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
    <div className="mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button
            onClick={exportToCsv}
            className="press"
            disabled={report.isLoading || report.customers.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" /> Export to CSV
          </Button>
        </div>
        <div className="space-y-4">
          <Input
            placeholder="Search by customer name…"
            value={report.searchTerm}
            onChange={(event) => report.setSearchTerm(event.target.value)}
            className="h-9"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {summaryTiles.map(({ title, value }) => (
              <StatTile key={title} label={title} value={value} />
            ))}
          </div>

          {report.isLoading ? (
            <PageLoader label="Loading credit report…" />
          ) : (
            <ScrollArea className="h-[calc(100dvh-24rem)] rounded-lg border border-border p-2">
              {report.customers.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  No outstanding credit found.
                </p>
              )}

              <Accordion type="single" collapsible className="space-y-2">
                {report.customers.map((customer) => (
                  <AccordionItem
                    key={customer.customerName}
                    value={customer.customerName}
                    className="overflow-hidden rounded-lg bg-surface"
                  >
                    <AccordionTrigger className="px-4 py-2 hover:bg-surface hover:no-underline">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xl font-medium ">{customer.customerName}</span>
                        <span className="text-xl font-bold text-primary">
                          ₹{formatAmount(customer.totalCredit)}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-3 pt-1">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-border">
                            {["ID", "Date", "Total", "Credit", "Paid", "Actions"].map((header) => (
                              <TableHead
                                key={header}
                                className="text-xs uppercase tracking-wide text-muted-foreground"
                              >
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-b border-border ">
                              <TableCell className="font-medium">#{invoice.id}</TableCell>
                              <TableCell>{formatDateDDMMMYYYY(invoice.date)}</TableCell>
                              <TableCell>₹{formatAmount(invoice.total)}</TableCell>
                              <TableCell className="text-destructive">
                                ₹{formatAmount(invoice.credit)}
                              </TableCell>
                              <TableCell className="text-success">
                                ₹{formatAmount(invoice.total - invoice.credit)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingInvoice(invoice)}
                                  className="press"
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
            </ScrollArea>
          )}
        </div>
      </div>

      <InvoiceEditDialog
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSaved={report.refresh}
      />
    </div>
  );
}
