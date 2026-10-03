import { useMemo, useState } from "react";
import { Pencil, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { KIND_LABEL, modeLabel, round2, supplierTotals, shortDate } from "../lib/billMath";
import { printStatement } from "../lib/statement";
import { StatusChip, } from "./Chip";
import { SupplierEditor } from "./SupplierEditor";

function Ledger({ supplier, bills, onClose, onEdit, onOpenBill, onPay, onAddBill }) {
  const entries = useMemo(() => {
    const list = [];
    for (const bill of bills) {
      list.push({ date: bill.bill_date, sort: 0, label: `Bill #${bill.bill_no}`, debit: Number(bill.total), billId: bill.id });
      for (const payment of bill.payments) {
        list.push({
          date: payment.paid_on,
          sort: 1,
          label: `${KIND_LABEL[payment.kind]}${payment.mode ? ` · ${modeLabel(payment.mode)}` : ""}${payment.reference ? ` ${payment.reference}` : ""} (#${bill.bill_no})`,
          credit: Number(payment.amount),
          billId: bill.id,
        });
      }
    }
    list.sort((a, b) => a.date.localeCompare(b.date) || a.sort - b.sort);
    let balance = 0;
    return list.map((entry) => ({ ...entry, balance: (balance = round2(balance + (entry.debit ?? 0) - (entry.credit ?? 0))) }));
  }, [bills]);
  const totals = supplierTotals(bills);

  return (
    <ToolSheet
      open
      onClose={onClose}
      title={supplier.name}
      description={[supplier.city, supplier.gstin, supplier.phone].filter(Boolean).join(" · ") || "Supplier ledger"}
      footer={
        <>
          <Button variant="rani" className="press" onClick={onAddBill}><Plus className="h-4 w-4" aria-hidden /> Add bill</Button>
          {totals.outstanding > 0 && <Button variant="outline" onClick={onPay}>Pay</Button>}
          <Button variant="outline" onClick={() => printStatement({ supplier, entries, totals })}><Printer className="h-4 w-4" aria-hidden /> Statement</Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Billed", formatRupees(totals.billed), ""],
          ["Paid & adjusted", formatRupees(round2(totals.billed - totals.outstanding)), "text-leaf"],
          ["Outstanding", formatRupees(totals.outstanding), totals.outstanding > 0 ? "text-destructive" : ""],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-xl bg-secondary px-2 py-2.5">
            <p className="eyebrow">{label}</p>
            <p className={`mt-1 font-display text-lg font-bold tabular-nums ${tone}`}>{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Credit allowed: {supplier.credit_days ?? 60} days.{totals.overdue > 0 && ` ${formatRupees(totals.overdue)} is overdue.`}</p>
      <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit supplier</Button>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bills yet.</p>
      ) : (
        <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-surface">
          {entries.map((entry, index) => (
            <li key={index}>
              <button type="button" className="press flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-secondary/60" onClick={() => onOpenBill(entry.billId)}>
                <div className="min-w-0 text-sm">
                  <p className="truncate font-semibold">{entry.label}</p>
                  <p className="text-xs text-muted-foreground">{shortDate(entry.date)}</p>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p className={`text-sm font-semibold ${entry.credit ? "text-leaf" : ""}`}>{entry.credit ? `− ${formatRupees(entry.credit)}` : formatRupees(entry.debit)}</p>
                  <p className="text-xs text-muted-foreground">owed {formatRupees(entry.balance)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ToolSheet>
  );
}

export function SuppliersTab({ suppliers, bills, onOpenBill, onPay, onAddBill }) {
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(
    () =>
      suppliers
        .map((supplier) => {
          const own = bills.filter((bill) => String(bill.supplier_id) === String(supplier.id));
          return { supplier, own, ...supplierTotals(own), open: own.filter((bill) => bill.status !== "paid").length };
        })
        .sort((a, b) => b.outstanding - a.outstanding || a.supplier.name.localeCompare(b.supplier.name)),
    [suppliers, bills]
  );
  const current = rows.find((row) => String(row.supplier.id) === String(openId));

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setCreating(true)}><Plus className="h-4 w-4" aria-hidden /> New supplier</Button>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No suppliers yet" description="Suppliers you add here also appear when adding products." />
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ supplier, outstanding, overdue, open }) => (
            <li key={supplier.id}>
              <button type="button" onClick={() => setOpenId(supplier.id)} className="press block w-full rounded-2xl border border-border/70 bg-surface px-4 py-3.5 text-left hover:border-indigo/40">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate font-display text-lg font-bold">{supplier.name}</p>
                  {overdue > 0 && <StatusChip status="overdue" />}
                </div>
                <p className="mt-2 font-display text-2xl font-bold tabular-nums leading-none">{formatRupees(outstanding)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {open === 0 ? "Nothing owed" : `${open} unpaid bill${open === 1 ? "" : "s"}`} · {supplier.credit_days ?? 60} day credit
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && (
        <Ledger
          supplier={current.supplier}
          bills={current.own}
          onClose={() => setOpenId(null)}
          onEdit={() => setEditing(current.supplier)}
          onOpenBill={onOpenBill}
          onPay={() => onPay(current.supplier.id)}
          onAddBill={() => onAddBill(current.supplier.id)}
        />
      )}
      <SupplierEditor open={Boolean(editing)} supplier={editing} onClose={() => setEditing(null)} />
      <SupplierEditor open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
