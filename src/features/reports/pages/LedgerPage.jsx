import { TableCell, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/queryClient";
import { getLedger } from "@/services/accountingService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatINR } from "@/utils/formatters";
import { ReportTable } from "../components/ReportTable";
import { useReportTable } from "../hooks/useReportTable";

const SEARCH_FIELDS = ["account_name", "description", "reference_table", "reference_id"];

const COLUMNS = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    sortType: "date",
    render: (row) => formatDateDDMMMYYYY(row.date),
  },
  { key: "transaction_id", header: "Transaction ID", render: (row) => `#${row.transaction_id}` },
  { key: "account_name", header: "Account", sortable: true },
  { key: "description", header: "Description" },
  {
    key: "debit",
    header: "Debit",
    sortable: true,
    sortType: "number",
    render: (row) => (row.debit ? formatINR(row.debit) : ""),
  },
  {
    key: "credit",
    header: "Credit",
    sortable: true,
    sortType: "number",
    render: (row) => (row.credit ? formatINR(row.credit) : ""),
  },
];

export default function LedgerPage() {
  const table = useReportTable({
    queryKey: queryKeys.accounting.ledger,
    queryFn: getLedger,
    searchFields: SEARCH_FIELDS,
    initialSort: { key: "date", type: "date", asc: true },
  });

  const totals = table.allRows.reduce(
    (acc, row) => ({
      debit: acc.debit + (Number(row.debit) || 0),
      credit: acc.credit + (Number(row.credit) || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const footerRows = (
    <TableRow className="font-semibold text-white">
      <TableCell colSpan={4} className="text-right">
        Total
      </TableCell>
      <TableCell>{formatINR(totals.debit)}</TableCell>
      <TableCell>{formatINR(totals.credit)}</TableCell>
    </TableRow>
  );

  return (
    <ReportTable
      title="Ledger"
      table={table}
      columns={COLUMNS}
      searchPlaceholder="Search account, description, reference..."
      rowKey={(row, index) => `${row.transaction_id}-${index}`}
      footerRows={footerRows}
    />
  );
}
