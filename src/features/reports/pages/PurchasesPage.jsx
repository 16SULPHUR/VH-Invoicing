import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useSupplierBooks } from "@/features/suppliers/hooks/useSupplierBooks";
import { daysBetween, round2 } from "@/features/suppliers/lib/billMath";
import { localISODate } from "@/utils/date";
import { defaultGstPeriod, fyLabel, fyOf, resolveGstPeriod } from "../lib/gstPeriod";
import { rupees2 } from "../lib/format";
import { CsvButton, DataTable, Kpi, Panel } from "../components/ReportUI";

const ITC_REVERSAL_DAYS = 180;

function periodChoices() {
  const current = fyOf(new Date());
  const choices = [];
  for (let fy = current; fy >= current - 1; fy -= 1) {
    choices.push(`${fy}-FY`);
    for (let q = 4; q >= 1; q -= 1) choices.push(`${fy}-Q${q}`);
  }
  return choices;
}

const half = (value) => round2(value / 2);

export default function PurchasesPage() {
  const books = useSupplierBooks();
  const [periodKey, setPeriod] = useState(() => defaultGstPeriod("quarterly"));
  const period = resolveGstPeriod(periodKey);
  const today = localISODate();

  const rows = useMemo(
    () =>
      books.bills
        .filter((bill) => bill.bill_date >= period.from && bill.bill_date <= period.to)
        .map((bill) => {
          const supplier = books.supplierById.get(String(bill.supplier_id));
          const gst = Number(bill.gst_amount);
          return {
            id: bill.id,
            date: bill.bill_date,
            supplier: supplier?.name ?? "Unknown",
            gstin: supplier?.gstin ?? "",
            billNo: bill.bill_no,
            hsn: bill.hsn ?? "",
            taxable: Number(bill.taxable_amount),
            cgst: bill.igst ? 0 : half(gst),
            sgst: bill.igst ? 0 : gst - half(gst),
            igst: bill.igst ? gst : 0,
            total: Number(bill.total),
            stale: bill.outstanding > 0 && daysBetween(bill.bill_date, today) > ITC_REVERSAL_DAYS && gst > 0,
          };
        }),
    [books.bills, books.supplierById, period.from, period.to, today]
  );

  const sum = (key, list = rows) => round2(list.reduce((total, row) => total + row[key], 0));
  const claimable = rows.filter((row) => row.gstin);
  const noGstin = rows.filter((row) => !row.gstin && row.cgst + row.sgst + row.igst > 0);
  const stale = rows.filter((row) => row.stale);

  const columns = [
    { key: "date", header: "Date" },
    { key: "supplier", header: "Supplier" },
    { key: "gstin", header: "GSTIN", render: (row) => row.gstin || <span className="text-destructive">Missing</span>, csv: (row) => row.gstin },
    { key: "billNo", header: "Bill no." },
    { key: "hsn", header: "HSN" },
    { key: "taxable", header: "Taxable", align: "right", render: (row) => rupees2(row.taxable) },
    { key: "cgst", header: "CGST", align: "right", render: (row) => rupees2(row.cgst) },
    { key: "sgst", header: "SGST", align: "right", render: (row) => rupees2(row.sgst) },
    { key: "igst", header: "IGST", align: "right", render: (row) => rupees2(row.igst) },
    { key: "total", header: "Total", align: "right", render: (row) => rupees2(row.total) },
  ];

  if (!books.checking && !books.ready) {
    return <p className="p-6 text-sm text-muted-foreground">Run docs/schema/supplier_invoices.sql to start recording supplier bills.</p>;
  }

  return (
    <div className="space-y-4 p-4 pb-10 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Input tax credit</p>
          <h2 className="font-display text-xl font-bold">Purchases · {period.label}</h2>
        </div>
        <select
          aria-label="Period"
          value={periodKey}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 rounded-full border-[1.5px] border-border bg-surface px-3 text-sm font-bold"
        >
          {periodChoices().map((key) => (
            <option key={key} value={key}>{resolveGstPeriod(key).label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi tone="hero" label="ITC available" value={rupees2(sum("cgst", claimable) + sum("sgst", claimable) + sum("igst", claimable))} hint={`${claimable.length} bill${claimable.length === 1 ? "" : "s"} with supplier GSTIN`} />
        <Kpi label="CGST + SGST" value={rupees2(sum("cgst", claimable) + sum("sgst", claimable))} />
        <Kpi label="IGST" value={rupees2(sum("igst", claimable))} />
        <Kpi label="Taxable purchases" value={rupees2(sum("taxable"))} hint={`${rows.length} bill${rows.length === 1 ? "" : "s"}`} />
      </div>

      {noGstin.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-marigold/60 bg-marigold/10 px-3.5 py-2.5 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          {noGstin.length} bill{noGstin.length === 1 ? " has" : "s have"} GST but the supplier GSTIN is missing, so {rupees2(sum("cgst", noGstin) + sum("sgst", noGstin) + sum("igst", noGstin))} of credit is left out until it is added.
        </p>
      )}
      {stale.length > 0 && (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          {stale.length} bill{stale.length === 1 ? " is" : "s are"} still unpaid after {ITC_REVERSAL_DAYS} days. GST rules require the credit on unpaid supplier bills to be reversed after that, so check with your CA.
        </p>
      )}

      <Panel
        title="Purchase register"
        actions={<CsvButton filename={`purchases_${period.key}`} headers={columns.map((c) => c.header)} rows={rows.map((row) => columns.map((c) => (c.csv ? c.csv(row) : row[c.key])))} />}
      >
        {books.isLoading ? <div className="h-40 animate-pulse rounded-xl bg-muted" /> : <DataTable columns={columns} rows={rows} limit={50} initialSort={{ key: "date", asc: false }} empty="No supplier bills in this period." />}
      </Panel>
      <p className="text-xs text-muted-foreground">Based on {fyLabel(fyOf(new Date(period.from)))} bills as entered. Eligibility of credit is subject to the supplier having filed their return.</p>
    </div>
  );
}
