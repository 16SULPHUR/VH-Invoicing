import { TableCell, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/queryClient";
import { getTrialBalance } from "@/services/accountingService";
import { formatINR } from "@/utils/formatters";
import { ReportTable } from "../components/ReportTable";
import { useReportTable } from "../hooks/useReportTable";
import { useReportRange } from "../range/useReportRange";

const COLUMNS = [
  { key: "account", header: "Account", sortable: true },
  {
    key: "debit",
    header: "Total Debit",
    sortable: true,
    sortType: "number",
    render: (row) => formatINR(row.debit),
  },
  {
    key: "credit",
    header: "Total Credit",
    sortable: true,
    sortType: "number",
    render: (row) => formatINR(row.credit),
  },
];

export default function TrialBalancePage() {
  const { range } = useReportRange();
  const table = useReportTable({
    queryKey: [...queryKeys.accounting.trialBalance, range.from, range.to],
    queryFn: () => getTrialBalance(range),
    searchFields: ["account"],
    initialSort: { key: "account", type: "string", asc: true },
    pageSize: 50,
  });

  const totals = table.allRows.reduce(
    (acc, row) => ({
      debit: acc.debit + (Number(row.debit) || 0),
      credit: acc.credit + (Number(row.credit) || 0),
    }),
    { debit: 0, credit: 0 }
  );

  const footerRows = (
    <TableRow className="bg-marigold/10 font-bold hover:bg-marigold/10">
      <TableCell className="text-right">Total</TableCell>
      <TableCell>{formatINR(totals.debit)}</TableCell>
      <TableCell>{formatINR(totals.credit)}</TableCell>
    </TableRow>
  );

  return (
    <ReportTable
      title="Trial balance"
      table={table}
      columns={COLUMNS}
      searchPlaceholder="Search account…"
      rowKey={(row) => row.account}
      footerRows={footerRows}
    />
  );
}
