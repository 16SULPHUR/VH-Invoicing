import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { change, customerRows, hourWeekGrid, lastSoldMap, productRows, stockRows } from "../lib/analytics";
import { buildInsights } from "../lib/insights";
import { percent, rangeLabel, rupees } from "../lib/format";
import { useRangeReport } from "../hooks/useRangeReport";
import { ReportShell } from "../components/ReportShell";
import { Kpi, Panel } from "../components/ReportUI";
import { CalendarHeat, HourHeat, PaymentMix, TrendChart } from "../components/Charts";

const TONE_ICON = { good: TrendingUp, bad: TrendingDown, note: Lightbulb };
const TONE_CLASS = { good: "bg-success/10 text-success", bad: "bg-destructive/10 text-destructive", note: "bg-marigold/20 text-warning" };

function TopList({ title, rows, to, search }) {
  const max = Math.max(1, ...rows.map((r) => r.sales));
  return (
    <Panel title={title} actions={<Link to={{ pathname: to, search }} className="text-xs font-bold text-rani hover:underline">See all</Link>}>
      <ol className="space-y-2.5">
        {rows.map((row, i) => (
          <li key={row.key ?? row.name} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-x-2">
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.name}</p>
              <span className="mt-1 block h-1 rounded-full bg-rani/80" style={{ width: `${(row.sales / max) * 100}%` }} aria-hidden />
            </div>
            <span className="text-sm font-bold tabular-nums">{rupees(row.sales)}</span>
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
      </ol>
    </Panel>
  );
}

export default function OverviewPage() {
  const report = useRangeReport();
  const { now, before, bills, all, index, days, trend, unit, effective, setRange } = report;

  const extra = useMemo(() => {
    const products = productRows(bills);
    const customers = customerRows(bills, all);
    const grid = hourWeekGrid(bills);
    const stock = stockRows(index, lastSoldMap(all));
    return { products, customers, grid, stock };
  }, [bills, all, index]);

  const insights = useMemo(
    () => buildInsights({ now, previous: before, lastYear: report.lastYearTotals, days, ...extra }),
    [now, before, report.lastYearTotals, days, extra]
  );

  const collected = now.cash + now.upi;
  const { search } = useLocation();

  return (
    <ReportShell report={report}>
      <p className="text-sm text-muted-foreground">
        {rangeLabel(effective)}
        {before && <> · compared with {rangeLabel(report.previous)}</>}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <div className="col-span-2">
          <Kpi tone="hero" label="Net sales" value={rupees(now.sales)} delta={change(now.sales, before?.sales)} hint={`${now.items} pieces · returns ${rupees(-now.returns)}`} />
        </div>
        <Kpi label="Bills" value={now.bills} delta={change(now.bills, before?.bills)} hint={`${now.customers} named customers`} />
        <Kpi label="Average bill" value={rupees(now.averageBill)} delta={change(now.averageBill, before?.averageBill)} />
        <Kpi label="Gross profit" value={now.profit == null ? "—" : rupees(now.profit)} delta={change(now.profit, before?.profit)} hint={`${percent(now.margin)} margin · cost known for ${percent(now.costCoverage)}`} />
        <Kpi label="Given on credit" value={rupees(now.credit)} delta={change(now.credit, before?.credit)} invert hint={`Collected ${rupees(collected)} in cash and UPI`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel eyebrow={unit === "day" ? "Day by day" : "Month by month"} title="Sales trend" actions={before && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-0.5 w-4 border-t-2 border-dashed border-indigo/50" aria-hidden />previous period</span>}>
          <TrendChart rows={trend} unit={unit} />
        </Panel>
        <Panel eyebrow="Worth knowing" title="What the numbers say">
          <ul className="space-y-2.5">
            {insights.map((item, i) => {
              const Icon = TONE_ICON[item.tone];
              return (
                <li key={i} className="flex gap-2.5 text-sm leading-snug">
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TONE_CLASS[item.tone]}`}>
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span>{item.text}</span>
                </li>
              );
            })}
            {insights.length === 0 && <li className="text-sm text-muted-foreground">No bills in this period.</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {days.length <= 400 && (
          <Panel eyebrow="Tap a day to open it" title="Sales calendar">
            <CalendarHeat days={days} onPick={(day) => setRange({ from: day.period, to: day.period })} />
          </Panel>
        )}
        <Panel eyebrow="Weekday by hour" title="When customers buy">
          <HourHeat grid={extra.grid} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel eyebrow="Payments" title="How customers paid">
          <PaymentMix totals={now} />
        </Panel>
        <TopList title="Top designs" rows={[...extra.products].sort((a, b) => b.sales - a.sales).slice(0, 6)} to="../products" search={search} />
        <TopList title="Top customers" rows={[...extra.customers].sort((a, b) => b.sales - a.sales).slice(0, 6)} to="../customers" search={search} />
      </div>
    </ReportShell>
  );
}
