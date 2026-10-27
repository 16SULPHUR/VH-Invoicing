import { useMemo, useState } from "react";
import { productRows, supplierRows } from "../lib/analytics";
import { dayYearLabel, percent, rupees } from "../lib/format";
import { useRangeReport } from "../hooks/useRangeReport";
import { ReportShell } from "../components/ReportShell";
import { DataTable, Kpi, Meter, Panel, Pills } from "../components/ReportUI";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "profit", label: "Most profit" },
  { value: "thin", label: "Thin margin" },
  { value: "discount", label: "Discounted" },
  { value: "unknown", label: "No cost" },
];

const BANDS = [
  [0, 500, "Under ₹500"],
  [500, 1000, "₹500 to ₹999"],
  [1000, 2000, "₹1,000 to ₹1,999"],
  [2000, 5000, "₹2,000 to ₹4,999"],
  [5000, Infinity, "₹5,000 and up"],
];

const marginCell = (r) => (r.margin == null ? <span className="text-muted-foreground">—</span> : <span className={r.margin < 0.2 ? "font-bold text-destructive" : ""}>{percent(r.margin)}</span>);

const PRODUCT_COLUMNS = [
  { key: "name", header: "Design", className: "font-semibold" },
  { key: "supplier", header: "Supplier" },
  { key: "quantity", header: "Pieces", align: "right" },
  { key: "sales", header: "Sales", align: "right", render: (r) => rupees(r.sales) },
  { key: "profit", header: "Profit", align: "right", value: (r) => r.profit ?? -Infinity, render: (r) => (r.profit == null ? "—" : rupees(r.profit)) },
  { key: "margin", header: "Margin", align: "right", value: (r) => r.margin ?? -Infinity, render: marginCell },
  { key: "discount", header: "Off tag", align: "right", render: (r) => (r.discount ? rupees(r.discount) : "—") },
  { key: "stock", header: "In stock", align: "right", value: (r) => r.stock ?? -Infinity, render: (r) => r.stock ?? "—" },
  { key: "lastSold", header: "Last sold", value: (r) => r.lastSold, render: (r) => dayYearLabel(r.lastSold) },
];

const SUPPLIER_COLUMNS = [
  { key: "supplier", header: "Supplier", className: "font-semibold" },
  { key: "designs", header: "Designs sold", align: "right" },
  { key: "quantity", header: "Pieces", align: "right" },
  { key: "sales", header: "Sales", align: "right", render: (r) => rupees(r.sales) },
  { key: "profit", header: "Profit", align: "right", render: (r) => (r.costedSales ? rupees(r.profit) : "—") },
  { key: "margin", header: "Margin", align: "right", value: (r) => r.margin ?? -Infinity, render: marginCell },
  { key: "stockCost", header: "Stock at cost", align: "right", render: (r) => rupees(r.stockCost) },
  {
    key: "sellThrough",
    header: "Sell-through",
    align: "right",
    value: (r) => r.sellThrough ?? -Infinity,
    render: (r) => <span className="inline-flex items-center gap-2">{percent(r.sellThrough)} <Meter value={r.sellThrough} /></span>,
  },
];

export default function ProductsPage() {
  const report = useRangeReport();
  const [filter, setFilter] = useState("all");
  const { bills, index, effective, now } = report;

  const products = useMemo(() => productRows(bills), [bills]);
  const suppliers = useMemo(() => supplierRows(products, index).filter((s) => s.sales !== 0 || s.stockCost > 0), [products, index]);

  const shown = useMemo(() => {
    switch (filter) {
      case "profit":
        return products.filter((p) => p.profit != null).sort((a, b) => b.profit - a.profit);
      case "thin":
        return products.filter((p) => p.margin != null && p.margin < 0.25);
      case "discount":
        return products.filter((p) => p.discount > 0);
      case "unknown":
        return products.filter((p) => !p.known || p.margin == null);
      default:
        return products;
    }
  }, [products, filter]);

  const bands = useMemo(() => {
    const rows = BANDS.map(([min, max, label]) => ({ label, pieces: 0, sales: 0, min, max }));
    for (const bill of bills)
      for (const line of bill.lines)
        if (line.kind === "sale") {
          const band = rows.find((b) => line.price >= b.min && line.price < b.max);
          band.pieces += line.quantity;
          band.sales += line.amount;
        }
    return rows;
  }, [bills]);
  const bandMax = Math.max(1, ...bands.map((b) => b.sales));
  const unknownSales = products.filter((p) => !p.known).reduce((s, p) => s + p.sales, 0);
  const file = `${effective.from}_${effective.to}`;

  return (
    <ReportShell report={report}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Designs sold" value={products.filter((p) => p.quantity > 0).length} hint={`${now.items} pieces`} />
        <Kpi label="Gross profit" value={now.profit == null ? "—" : rupees(now.profit)} hint={`${percent(now.margin)} margin on known costs`} />
        <Kpi label="Given off tag price" value={rupees(now.discount)} hint="Tag price minus billed price" />
        <Kpi label="Sold, not in stock list" value={rupees(unknownSales)} hint="Typed at the till, so no cost or stock" />
      </div>

      <Panel title="Designs" actions={<Pills options={FILTERS} value={filter} onChange={setFilter} label="Filter designs" />}>
        <DataTable columns={PRODUCT_COLUMNS} rows={shown} initialSort={filter === "profit" ? { key: "profit", asc: false } : { key: "sales", asc: false }} key={filter} rowKey={(r) => r.name} csvName={`designs_${file}.csv`} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel eyebrow="Sell-through is pieces sold out of sold plus still in stock" title="Suppliers">
          <DataTable columns={SUPPLIER_COLUMNS} rows={suppliers} initialSort={{ key: "sales", asc: false }} rowKey={(r) => r.supplier} csvName={`suppliers_${file}.csv`} />
        </Panel>
        <Panel eyebrow="Billed price per piece" title="Price points that sell">
          <ul className="space-y-3">
            {bands.map((band) => (
              <li key={band.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{band.label}</span>
                  <span className="tabular-nums"><b>{rupees(band.sales)}</b> <span className="text-muted-foreground">· {band.pieces} pcs</span></span>
                </div>
                <span className="mt-1 block h-2 rounded-full bg-indigo" style={{ width: `${(band.sales / bandMax) * 100}%` }} aria-hidden />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </ReportShell>
  );
}
