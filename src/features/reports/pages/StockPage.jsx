import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { lastSoldMap, stockRows } from "../lib/analytics";
import { dayYearLabel, percent, plural, rupees } from "../lib/format";
import { useReportData } from "../hooks/useReportData";
import { ReportShell } from "../components/ReportShell";
import { DataTable, Kpi, Panel } from "../components/ReportUI";

const AGES = [
  { key: "fresh", label: "Sold or added in 30 days", max: 30, cls: "bg-leaf" },
  { key: "month", label: "31 to 90 days", max: 90, cls: "bg-indigo/60" },
  { key: "slow", label: "91 to 180 days", max: 180, cls: "bg-marigold" },
  { key: "stale", label: "181 to 365 days", max: 365, cls: "bg-rani/70" },
  { key: "dead", label: "Over a year", max: Infinity, cls: "bg-destructive" },
];

const ageOf = (row) => AGES.find((a) => (row.idleDays ?? Infinity) <= a.max);

const COLUMNS = [
  { key: "name", header: "Design", className: "font-semibold" },
  { key: "supplier", header: "Supplier" },
  { key: "stock", header: "Pieces", align: "right" },
  { key: "cost", header: "Cost", align: "right", render: (r) => rupees(r.cost) },
  { key: "price", header: "Tag", align: "right", render: (r) => rupees(r.price) },
  { key: "stockCost", header: "Value at cost", align: "right", render: (r) => rupees(r.stockCost) },
  { key: "lastSold", header: "Last sold", value: (r) => r.lastSold, render: (r) => (r.lastSold ? dayYearLabel(r.lastSold) : <span className="text-muted-foreground">Never</span>) },
  { key: "idleDays", header: "Idle days", align: "right", value: (r) => r.idleDays ?? Infinity, render: (r) => r.idleDays ?? "—" },
];

export default function StockPage() {
  const data = useReportData();
  const [age, setAge] = useState(null);

  const rows = useMemo(() => stockRows(data.index, lastSoldMap(data.all)), [data.index, data.all]);
  const inStock = rows.filter((r) => r.stock > 0);
  const negative = rows.filter((r) => r.stock < 0);
  const cost = inStock.reduce((s, r) => s + r.stockCost, 0);
  const value = inStock.reduce((s, r) => s + r.stockValue, 0);
  const pieces = inStock.reduce((s, r) => s + r.stock, 0);

  const buckets = AGES.map((a) => {
    const list = inStock.filter((r) => ageOf(r) === a);
    return { ...a, designs: list.length, cost: list.reduce((s, r) => s + r.stockCost, 0) };
  });
  const shown = age ? inStock.filter((r) => ageOf(r)?.key === age) : inStock;

  return (
    <ReportShell report={data}>
      <p className="text-sm text-muted-foreground">Stock as it stands today. Date range does not apply here.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi tone="hero" label="Stock at cost" value={rupees(cost)} hint={`${plural(pieces, "piece")} · ${plural(inStock.length, "design")}`} />
        <Kpi label="At tag price" value={rupees(value)} hint={`${percent(value ? (value - cost) / value : null)} margin waiting in stock`} />
        <Kpi label="Idle over 6 months" value={rupees(buckets[3].cost + buckets[4].cost)} hint={plural(buckets[3].designs + buckets[4].designs, "design")} />
        <Kpi label="Below zero" value={negative.length} hint={<Link to="/inventory" className="font-bold text-rani hover:underline">Fix with a stock count</Link>} />
      </div>

      <Panel eyebrow="Days since each design last sold, or was added if never sold" title="How old is the stock">
        <div className="flex h-5 gap-[2px] overflow-hidden rounded-full bg-muted">
          {buckets.map((b) => (
            <span key={b.key} className={b.cls} style={{ width: `${cost ? (b.cost / cost) * 100 : 0}%` }} title={`${b.label}: ${rupees(b.cost)}`} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {buckets.map((b) => (
            <button
              key={b.key}
              type="button"
              aria-pressed={age === b.key}
              onClick={() => setAge(age === b.key ? null : b.key)}
              className={`press rounded-xl border-[1.5px] p-2.5 text-left transition-colors ${age === b.key ? "border-indigo bg-indigo/5" : "border-border hover:border-indigo/40"}`}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-sm ${b.cls}`} aria-hidden />
                {b.label}
              </span>
              <span className="mt-1 block font-display text-lg font-bold tabular-nums">{rupees(b.cost)}</span>
              <span className="text-[11px] text-muted-foreground">{plural(b.designs, "design")}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={age ? AGES.find((a) => a.key === age).label : "All stock"}>
        <DataTable key={age ?? "all"} columns={COLUMNS} rows={shown} initialSort={{ key: "stockCost", asc: false }} rowKey={(r) => r.name} csvName={`stock_${age ?? "all"}.csv`} />
      </Panel>
    </ReportShell>
  );
}
