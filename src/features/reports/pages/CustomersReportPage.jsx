import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { customerRows } from "../lib/analytics";
import { dayYearLabel, percent, rupees } from "../lib/format";
import { useRangeReport } from "../hooks/useRangeReport";
import { ReportShell } from "../components/ReportShell";
import { DataTable, Kpi, Panel, Pills } from "../components/ReportUI";

const DAY = 86_400_000;
const since = (date) => Math.floor((Date.now() - date.getTime()) / DAY);

const COLUMNS = [
  { key: "name", header: "Customer", className: "font-semibold" },
  { key: "phone", header: "Phone" },
  { key: "bills", header: "Bills", align: "right" },
  { key: "sales", header: "Spent", align: "right", render: (r) => rupees(r.sales) },
  { key: "averageBill", header: "Avg bill", align: "right", render: (r) => rupees(r.averageBill) },
  { key: "credit", header: "On credit", align: "right", render: (r) => (r.credit ? rupees(r.credit) : "—") },
  { key: "first", header: "First visit", value: (r) => r.first, render: (r) => (r.first ? dayYearLabel(r.first) : "—") },
  { key: "last", header: "Last visit", value: (r) => r.last, render: (r) => dayYearLabel(r.last) },
];

const LAPSED_COLUMNS = [
  ...COLUMNS.slice(0, 5),
  { key: "last", header: "Last visit", value: (r) => r.last, render: (r) => dayYearLabel(r.last) },
  { key: "away", header: "Days away", align: "right", value: (r) => since(r.last), render: (r) => <b className="text-destructive">{since(r.last)}</b> },
];

const SEGMENTS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "returning", label: "Returning" },
];

export default function CustomersReportPage() {
  const report = useRangeReport();
  const [segment, setSegment] = useState("all");
  const { bills, all, now, effective } = report;
  const start = new Date(`${effective.from}T00:00:00`);

  const customers = useMemo(() => customerRows(bills, all), [bills, all]);
  const isNew = (c) => c.first && c.first >= start;
  const newCount = customers.filter(isNew).length;
  const repeaters = customers.filter((c) => c.bills > 1).length;

  const lapsed = useMemo(
    () =>
      customerRows(all)
        .filter((c) => (c.bills >= 2 || c.sales >= 5000) && since(c.last) >= 90)
        .sort((a, b) => b.sales - a.sales),
    [all]
  );

  const rows = segment === "new" ? customers.filter(isNew) : segment === "returning" ? customers.filter((c) => !isNew(c)) : customers;
  const namedSales = customers.reduce((s, c) => s + c.sales, 0);
  const file = `${effective.from}_${effective.to}`;

  return (
    <ReportShell report={report}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Named customers" value={customers.length} hint={`${newCount} new · ${customers.length - newCount} returning`} />
        <Kpi label="Came more than once" value={percent(customers.length ? repeaters / customers.length : null)} hint={`${repeaters} customers in this period`} />
        <Kpi label="Bills with no name" value={percent(now.bills ? now.walkIns / now.bills : null)} hint={`${now.walkIns} walk-in bills`} />
        <Kpi label="Spend per customer" value={rupees(customers.length ? namedSales / customers.length : 0)} hint="Named customers only" />
      </div>

      <Panel title="Customers" actions={<Pills options={SEGMENTS} value={segment} onChange={setSegment} label="Customer segment" />}>
        <DataTable key={segment} columns={COLUMNS} rows={rows} initialSort={{ key: "sales", asc: false }} rowKey={(r) => r.key} csvName={`customers_${file}.csv`} />
      </Panel>

      <Panel
        eyebrow="Bought twice or spent ₹5,000+, not seen in 90 days"
        title="Haven't come back"
        actions={<Link to="/whatsapp" className="text-xs font-bold text-rani hover:underline">Message them from WhatsApp</Link>}
      >
        <DataTable columns={LAPSED_COLUMNS} rows={lapsed} rowKey={(r) => r.key} csvName="customers_lapsed.csv" empty="Everyone good has been back recently." />
      </Panel>

      <p className="text-sm text-muted-foreground">
        Money still owed is on <Link to="/customers" className="font-bold text-rani hover:underline">Customers › Credit</Link>.
      </p>
    </ReportShell>
  );
}
