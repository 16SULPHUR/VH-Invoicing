import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { useReportRange } from "@/features/reports/range/useReportRange";
import { booksService } from "@/services/booksService";
import { formatINR } from "@/utils/formatters";

function Section({ title, rows, total }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
      <p className="eyebrow border-b border-border px-4 py-2.5">{title}</p>
      <div className="divide-y divide-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
            <span>{label}</span>
            <span className="tabular-nums">{formatINR(value)}</span>
          </div>
        ))}
        <div className="flex justify-between gap-4 bg-marigold/10 px-4 py-2.5 font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

const sum = (rows) => rows.reduce((total, [, value]) => total + value, 0);

export default function BalanceSheetPage() {
  const { range } = useReportRange();
  const { data, isLoading, error } = useQuery({
    queryKey: ["books", "balance-sheet", range.to],
    queryFn: () => booksService.accountBalances(range.to),
  });

  const net = (name) => data?.[name] ?? 0;
  const bank = net("Bank") + net("UPI");
  const assets = [
    ["Cash", net("Cash")],
    ["Bank", bank],
    ["Customers owe", net("Accounts Receivable")],
    ["GST input", net("GST Input")],
  ];
  const liabilities = [
    ["Suppliers to pay", -net("Accounts Payable")],
    ["GST payable", -net("GST Output")],
  ];
  const profit = -(net("Sales Revenue") + net("Purchases") + net("Expenses"));
  const equity = [
    ["Capital", -net("Capital")],
    ["Profit to date", profit],
  ];
  const gap = sum(assets) - sum(liabilities) - sum(equity);

  return (
    <div className="max-w-2xl space-y-4 p-4 md:p-6">
      <PageHeader title="Balance sheet" subtitle={range.to ? `As on ${range.to}` : "As on today"} />
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
      {!isLoading && !error && (
        <>
          <Section title="What the shop has" rows={assets} total={sum(assets)} />
          <Section title="What the shop owes" rows={liabilities} total={sum(liabilities)} />
          <Section title="Owner's money" rows={equity} total={sum(equity)} />
          {Math.abs(gap) >= 1 && (
            <p className="rounded-2xl bg-marigold/15 px-3.5 py-2.5 text-sm text-warning">
              {formatINR(gap)} does not tie up. Old bills with no payment recorded leave their entries unbalanced.
            </p>
          )}
        </>
      )}
    </div>
  );
}
