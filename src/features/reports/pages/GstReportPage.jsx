import { TableCell, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/queryClient";
import { getGSTOutput } from "@/services/accountingService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatINR } from "@/utils/formatters";
import { ReportTable } from "../components/ReportTable";
import { useReportTable } from "../hooks/useReportTable";

const SEARCH_FIELDS = ["description", "reference_table", "reference_id"];

const COLUMNS = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    sortType: "date",
    render: (row) => formatDateDDMMMYYYY(row.date),
  },
  { key: "transaction_id", header: "Transaction ID", render: (row) => `#${row.transaction_id}` },
  { key: "description", header: "Description", sortable: true },
  {
    key: "reference",
    header: "Reference",
    render: (row) =>
      `${row.reference_table || ""} ${row.reference_id ? `#${row.reference_id}` : ""}`,
  },
  {
    key: "credit",
    header: "GST (Credit)",
    sortable: true,
    sortType: "number",
    render: (row) => formatINR(row.credit),
  },
];

export default function GstReportPage() {
  const table = useReportTable({
    queryKey: queryKeys.accounting.gst,
    queryFn: getGSTOutput,
    select: (data) => data.transactions,
    searchFields: SEARCH_FIELDS,
    initialSort: { key: "date", type: "date", asc: false },
  });

  const pageSubtotal = table.rows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);
  const grandTotal = table.sourceRows.reduce((sum, row) => sum + (Number(row.credit) || 0), 0);

  const footerRows = (
    <>
      <TableRow className="font-semibold ">
        <TableCell colSpan={4} className="text-right">
          Subtotal (page)
        </TableCell>
        <TableCell>{formatINR(pageSubtotal)}</TableCell>
      </TableRow>
      <TableRow className="font-semibold ">
        <TableCell colSpan={4} className="text-right">
          Total GST
        </TableCell>
        <TableCell>{formatINR(grandTotal)}</TableCell>
      </TableRow>
    </>
  );

  return (
    <ReportTable
      title="GST Output"
      table={table}
      columns={COLUMNS}
      searchPlaceholder="Search description or ref..."
      rowKey={(row, index) => `${row.transaction_id}-${index}`}
      footerRows={footerRows}
    />
  );
}
