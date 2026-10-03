import { queryKeys } from "@/lib/queryClient";
import { getTransactions } from "@/services/accountingService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { ReportTable } from "../components/ReportTable";
import { useReportTable } from "../hooks/useReportTable";
import { useReportRange } from "../range/useReportRange";

const SEARCH_FIELDS = ["description", "reference_table", "reference_id"];

const COLUMNS = [
  {
    key: "date",
    header: "Date",
    sortable: true,
    sortType: "date",
    render: (row) => formatDateDDMMMYYYY(row.date),
  },
  {
    key: "id",
    header: "Transaction ID",
    sortable: true,
    sortType: "number",
    render: (row) => `#${row.id}`,
  },
  { key: "description", header: "Description", sortable: true },
  {
    key: "reference",
    header: "Reference",
    render: (row) =>
      `${row.reference_table || ""} ${row.reference_id ? `#${row.reference_id}` : ""}`,
  },
];

export default function TransactionsPage() {
  const { range } = useReportRange();
  const table = useReportTable({
    queryKey: [...queryKeys.accounting.transactions, range.from, range.to],
    queryFn: () => getTransactions(range),
    searchFields: SEARCH_FIELDS,
    initialSort: { key: "date", type: "date", asc: false },
  });

  return (
    <ReportTable
      title="Transactions"
      table={table}
      columns={COLUMNS}
      searchPlaceholder="Search description or ref…"
      emptyMessage="No transactions found."
    />
  );
}
