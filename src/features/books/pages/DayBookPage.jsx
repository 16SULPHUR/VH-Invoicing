import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportTable } from "@/features/reports/components/ReportTable";
import { useReportTable } from "@/features/reports/hooks/useReportTable";
import { useReportRange } from "@/features/reports/range/useReportRange";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatINR } from "@/utils/formatters";
import { referenceLabel } from "../lib/entryKinds";

export default function DayBookPage() {
  const { range } = useReportRange();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const table = useReportTable({
    queryKey: queryKeys.books.daybook(range.from, range.to),
    queryFn: () => booksService.dayBook(range),
    select: (entries) => entries.map((entry) => ({ ...entry, type: referenceLabel(entry.reference_table) })),
    searchFields: ["description", "type"],
    initialSort: { key: "date", type: "date", asc: false },
    pageSize: 50,
  });

  const remove = useMutation({
    mutationFn: (id) => booksService.deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      toast({ title: "Entry deleted" });
    },
    onError: (error) => toast({ title: "Could not delete", description: error.message, variant: "destructive" }),
  });

  const columns = [
    { key: "date", header: "Date", sortable: true, sortType: "date", render: (row) => formatDateDDMMMYYYY(row.date) },
    { key: "type", header: "Type", sortable: true },
    { key: "description", header: "Particulars" },
    { key: "amount", header: "Amount", sortable: true, sortType: "number", render: (row) => formatINR(row.amount) },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.reference_table === "journal" && (
          <button
            type="button"
            aria-label="Delete entry"
            className="press text-muted-foreground hover:text-destructive"
            onClick={() => window.confirm("Delete this entry?") && remove.mutate(row.id)}
          >
            <Trash2 size={15} aria-hidden />
          </button>
        ),
    },
  ];

  return (
    <ReportTable
      title="Day book"
      table={table}
      columns={columns}
      searchPlaceholder="Search particulars or type…"
      rowKey={(row) => row.id}
      emptyMessage="No entries in this period."
    />
  );
}
