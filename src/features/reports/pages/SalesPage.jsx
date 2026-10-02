import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { byPeriod } from "../lib/analytics";
import { dayLabel, dayYearLabel, monthLabel, percent, rupees, weekdayLabel } from "../lib/format";
import { useRangeReport } from "../hooks/useRangeReport";
import { ReportShell } from "../components/ReportShell";
import { DataTable, Kpi, Panel, Pills } from "../components/ReportUI";
import { BillDialog } from "../components/BillDialog";

const VIEWS = [
  { value: "day", label: "By day" },
  { value: "month", label: "By month" },
  { value: "bill", label: "Bills" },
];

const money = (key, header) => ({ key, header, align: "right", render: (r) => rupees(r[key]) });

const periodColumns = (unit) => [
  unit === "month"
    ? { key: "period", header: "Month", render: (r) => monthLabel(r.period) }
    : { key: "period", header: "Day", render: (r) => <span>{dayLabel(r.period)} <span className="text-muted-foreground">{weekdayLabel(r.period).slice(0, 3)}</span></span> },
  { key: "bills", header: "Bills", align: "right" },
  { key: "items", header: "Pieces", align: "right" },
  money("sales", "Net sales"),
  money("returns", "Returns"),
  money("averageBill", "Avg bill"),
  money("cash", "Cash"),
  money("upi", "UPI"),
  money("credit", "Credit"),
  { key: "profit", header: "Profit", align: "right", render: (r) => (r.profit == null ? "—" : rupees(r.profit)) },
  { key: "margin", header: "Margin", align: "right", render: (r) => percent(r.margin) },
];

const BILL_COLUMNS = [
  { key: "id", header: "Bill", render: (r) => <span className="font-bold">{r.id}</span> },
  { key: "date", header: "Date", value: (r) => r.date, render: (r) => dayYearLabel(r.date), csv: (r) => r.day },
  { key: "customerName", header: "Customer", render: (r) => r.customerName || <span className="text-muted-foreground">Walk-in</span> },
  { key: "customerPhone", header: "Phone" },
  { key: "items", header: "Pieces", align: "right" },
  money("sales", "Net sales"),
  money("adjustments", "Not sales"),
  money("total", "Bill total"),
  money("cash", "Cash"),
  money("upi", "UPI"),
  money("credit", "Credit"),
];

export default function SalesPage() {
  const report = useRangeReport();
  const [view, setView] = useState(report.unit === "month" ? "month" : "day");
  const [query, setQuery] = useState("");
  const [bill, setBill] = useState(null);
  const { bills, now, effective } = report;

  const periods = useMemo(() => (view === "bill" ? [] : byPeriod(bills, view)), [bills, view]);
  const billRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = [...bills].reverse();
    if (!needle) return rows;
    return rows.filter((b) => String(b.id) === needle || b.customerName.toLowerCase().includes(needle) || String(b.customerPhone).includes(needle) || b.lines.some((l) => l.name.toLowerCase().includes(needle)));
  }, [bills, query]);

  const oddLines = useMemo(
    () =>
      bills.flatMap((b) =>
        b.lines.filter((l) => l.kind !== "sale").map((l, i) => ({ id: `${b.key}-${i}`, bill: b, name: l.name, amount: l.amount, kind: l.kind }))
      ),
    [bills]
  );

  const file = `${effective.from}_${effective.to}`;

  return (
    <ReportShell report={report}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Net sales" value={rupees(now.sales)} hint={`${now.bills} bills · ${now.items} pieces`} />
        <Kpi label="Returns" value={rupees(-now.returns)} hint="Goods taken back, already netted off" />
        <Kpi label="Discount off tag" value={rupees(now.discount)} hint="Sold below the stock list price" />
        <Kpi label="Not sales" value={rupees(now.adjustments)} hint="Old dues, deposits and advances on bills" />
      </div>

      <Panel
        title="Sales register"
        actions={
          <>
            {view === "bill" && (
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bill no, name, phone, item" aria-label="Search bills" className="h-8 pl-9 text-sm" />
              </div>
            )}
            <Pills options={VIEWS} value={view} onChange={setView} label="Group sales" />
          </>
        }
      >
        {view === "bill" ? (
          <DataTable key="bills" columns={BILL_COLUMNS} rows={billRows} limit={25} rowKey={(r) => r.key} csvName={`bills_${file}.csv`} onRowClick={setBill} />
        ) : (
          <DataTable key={view} columns={periodColumns(view)} rows={[...periods].reverse()} limit={31} rowKey={(r) => r.period} csvName={`sales_by_${view}_${file}.csv`} />
        )}
      </Panel>

      <Panel eyebrow="Kept out of sales, or netted off" title="Returns and non-sale lines">
        <DataTable
          columns={[
            { key: "bill", header: "Bill", value: (r) => r.bill.id, render: (r) => <span className="font-bold">{r.bill.id}</span> },
            { key: "date", header: "Date", value: (r) => r.bill.date, render: (r) => dayYearLabel(r.bill.date), csv: (r) => r.bill.day },
            { key: "customer", header: "Customer", value: (r) => r.bill.customerName },
            { key: "name", header: "Line" },
            { key: "kind", header: "Treated as", render: (r) => (r.kind === "return" ? "Return (reduces sales)" : "Not a sale (left out)") },
            money("amount", "Amount"),
          ]}
          rows={oddLines}
          rowKey={(r) => r.id}
          onRowClick={(r) => setBill(r.bill)}
          csvName={`returns_and_adjustments_${file}.csv`}
          empty="No returns or non-sale lines in this period."
        />
      </Panel>

      <BillDialog bill={bill} onClose={() => setBill(null)} />
    </ReportShell>
  );
}
