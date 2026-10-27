import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { DUE_SOON_DAYS, dueText, shortDate } from "../lib/billMath";
import { FilterChip, StatusChip, } from "./Chip";

const FILTERS = [
  { value: "open", label: "Unpaid", test: (bill) => bill.status !== "paid" },
  { value: "overdue", label: "Overdue", test: (bill) => bill.status === "overdue" },
  { value: "soon", label: `Due in ${DUE_SOON_DAYS} days`, test: (bill) => bill.status !== "paid" && bill.daysLeft >= 0 && bill.daysLeft <= DUE_SOON_DAYS },
  { value: "paid", label: "Paid", test: (bill) => bill.status === "paid" },
  { value: "all", label: "All", test: () => true },
];

export function BillsTab({ bills, supplierById, suppliers, onOpen }) {
  const [filter, setFilter] = useState("open");
  const [supplier, setSupplier] = useState("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const test = FILTERS.find((entry) => entry.value === filter).test;
    const needle = search.trim().toLowerCase();
    return bills
      .filter(test)
      .filter((bill) => supplier === "all" || String(bill.supplier_id) === supplier)
      .filter((bill) => !needle || bill.bill_no.toLowerCase().includes(needle) || (supplierById.get(String(bill.supplier_id))?.name ?? "").toLowerCase().includes(needle))
      .sort((a, b) => (filter === "paid" || filter === "all" ? b.bill_date.localeCompare(a.bill_date) : a.due_date.localeCompare(b.due_date)));
  }, [bills, filter, supplier, search, supplierById]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((entry) => (
            <FilterChip key={entry.value} active={filter === entry.value} onClick={() => setFilter(entry.value)}>{entry.label}</FilterChip>
          ))}
        </div>
        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          <Select value={supplier} onValueChange={setSupplier}>
            <SelectTrigger className="h-9 min-w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All suppliers</SelectItem>
              {suppliers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bill no. or supplier" type="search" className="h-9 sm:w-52" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="No bills here" description={bills.length === 0 ? "Add the first supplier bill to start tracking dues." : "Try another filter."} />
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-surface">
          {rows.map((bill) => (
            <li key={bill.id}>
              <button type="button" onClick={() => onOpen(bill.id)} className="press flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/60">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{supplierById.get(String(bill.supplier_id))?.name ?? "Unknown supplier"}</p>
                  <p className="text-xs text-muted-foreground">#{bill.bill_no} · {shortDate(bill.bill_date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums leading-none">
                    {formatRupees(bill.status === "paid" ? bill.total : bill.outstanding)}
                  </p>
                  <p className={`mt-1 text-xs tabular-nums ${bill.status === "overdue" ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                    {bill.status === "paid" ? "of total" : `of ${formatRupees(bill.total)} · `}{dueText(bill)}
                  </p>
                </div>
                <StatusChip status={bill.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
