import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { useReportRange } from "@/features/reports/range/useReportRange";
import { booksService } from "@/services/booksService";
import { formatINR } from "@/utils/formatters";

function Row({ label, value, bold, note }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 px-4 py-2.5 ${bold ? "bg-marigold/10 font-bold" : ""}`}>
      <span>
        {label}
        {note && <span className="block text-xs font-normal text-muted-foreground">{note}</span>}
      </span>
      <span className="tabular-nums">{formatINR(value)}</span>
    </div>
  );
}

export default function ProfitLossPage() {
  const { range } = useReportRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ["books", "profit-loss", range.from, range.to],
    queryFn: () => booksService.periodTotals(range),
  });

  const sales = -(data?.["Sales Revenue"] ?? 0);
  const purchases = data?.Purchases ?? 0;
  const expenses = data?.Expenses ?? 0;
  const gross = sales - purchases;

  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-6">
      <PageHeader title="Profit & loss" subtitle="Sales without GST, less purchases and expenses" />
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
      {isLoading ? null : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/70 bg-surface">
          <Row label="Sales" value={sales} />
          <Row label="Purchases" value={purchases} note="Stock bought in this period, not the cost of what was sold" />
          <Row label="Gross profit" value={gross} bold />
          <Row label="Expenses" value={expenses} />
          <Row label="Net profit" value={gross - expenses} bold />
        </div>
      )}
    </div>
  );
}
