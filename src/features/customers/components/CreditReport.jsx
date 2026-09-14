import { useState } from "react";
import { FileDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      ])
    );
    downloadCsv(`credit_report_${toISODate()}.csv`, toCsv(CSV_HEADERS, rows));
  };

  return (
    <div className="mx-auto">
      <Card className="border-0 bg-gray-900 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-pink-400">Credit Reports</CardTitle>
            <Button
              onClick={exportToCsv}
              className="bg-pink-600 text-white hover:bg-pink-700"
              disabled={report.isLoading || report.customers.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" /> Export to CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Input
            placeholder="Search by customer name..."
            value={report.searchTerm}
            onChange={(event) => report.setSearchTerm(event.target.value)}
            className="mb-2 border-gray-700 bg-gray-800 text-white focus:border-pink-500"
          />

          <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summaryTiles.map(({ title, value }) => (
              <Card key={title} className="border-0 bg-gray-800 shadow-md">
                <CardContent className="pb-2 pt-2">
                  <p className="mb-1 text-sm text-pink-400">{title}</p>
                  <p className="mb-0 text-2xl font-bold text-white">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {report.isLoading ? (
            <PageLoader label="Loading credit report…" />
          ) : (
            <ScrollArea className="h-[calc(100vh-25rem)] p-2 outline outline-1 outline-white">
              {report.customers.length === 0 && (
                <p className="p-4 text-center text-sm text-gray-400">
                  No outstanding credit found.
                </p>
              )}

              <Accordion type="single" collapsible className="space-y-2">
                {report.customers.map((customer) => (
                  <AccordionItem
                    key={customer.customerName}
                    value={customer.customerName}
                    className="overflow-hidden rounded-lg bg-gray-800"
                  >
                    <AccordionTrigger className="px-4 py-2 hover:bg-gray-700 hover:no-underline">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xl font-medium text-white">
                          {customer.customerName}
                        </span>
                        <span className="text-xl font-bold text-pink-400">
                          ₹{formatAmount(customer.totalCredit)}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-3 pt-1">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-700">
                            {["ID", "Date", "Total", "Credit", "Paid", "Actions"].map((header) => (
                              <TableHead key={header} className="text-pink-400">
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.invoices.map((invoice) => (
                            <TableRow
                              key={invoice.id}
                              className="border-b border-gray-700 text-white"
                            >
                              <TableCell className="font-medium">#{invoice.id}</TableCell>
                              <TableCell>{formatDateDDMMMYYYY(invoice.date)}</TableCell>
                              <TableCell>₹{formatAmount(invoice.total)}</TableCell>
                              <TableCell className="text-red-400">
                                ₹{formatAmount(invoice.credit)}
                              </TableCell>
                              <TableCell className="text-green-400">
                                ₹{formatAmount(invoice.total - invoice.credit)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingInvoice(invoice)}
                                  className="border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"
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
        </CardContent>
      </Card>

      <InvoiceEditDialog
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSaved={report.refresh}
      />
    </div>
  );
}
