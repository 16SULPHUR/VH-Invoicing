import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/common/Field";
import { localISODate } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { TextArea } from "@/features/counter/components/Bits";
import { useEnteredBy } from "@/features/cashbook/hooks/useEnteredBy";
import { KIND_LABEL, MODES, allocateOldestFirst, dueText, round2, shortDate } from "../lib/billMath";
import { useSupplierBookMutations } from "../hooks/useSupplierBooks";


const TITLE = { payment: "Pay supplier", return: "Record goods return", discount: "Record kasar / discount" };
const HELP = {
  payment: "One payment can cover several bills; it fills the earliest due first.",
  return: "Goods sent back reduce what you owe on the bill.",
  discount: "Kasar or a discount allowed by the supplier reduces what you owe.",
};

export function PayDialog({ open, onClose, bills, suppliers, supplierById, supplierId, billId, kind = "payment" }) {
  const { addPayments } = useSupplierBookMutations();
  const [by] = useEnteredBy();
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const [alloc, setAlloc] = useState({});
  const [mode, setMode] = useState("cheque");
  const [fields, setFields] = useState({ paid_on: localISODate(), reference: "", cheque_date: "", bank: "", note: "" });

  const open_ = useMemo(
    () => bills.filter((bill) => String(bill.supplier_id) === supplier && bill.outstanding > 0).sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [bills, supplier]
  );

  useEffect(() => {
    if (!open) return;
    const initialSupplier = supplierId ? String(supplierId) : bills.find((bill) => bill.id === billId)?.supplier_id ?? "";
    setSupplier(String(initialSupplier));
    setMode("cheque");
    setFields({ paid_on: localISODate(), reference: "", cheque_date: "", bank: "", note: "" });
    const target = bills.find((bill) => bill.id === billId);
    if (target) {
      setAlloc({ [target.id]: String(target.outstanding) });
      setAmount(String(target.outstanding));
    } else {
      setAlloc({});
      setAmount("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = round2(Object.values(alloc).reduce((sum, value) => sum + toNumber(value), 0));
  const owed = round2(open_.reduce((sum, bill) => sum + bill.outstanding, 0));
  const overBill = open_.find((bill) => toNumber(alloc[bill.id]) > bill.outstanding + 0.005);

  const changeAmount = (value) => {
    setAmount(value);
    const split = allocateOldestFirst(open_, toNumber(value));
    setAlloc(Object.fromEntries(Object.entries(split).map(([id, share]) => [id, String(share)])));
  };

  const changeSupplier = (value) => {
    setSupplier(value);
    setAlloc({});
    setAmount("");
  };

  const changeLine = (id, value) => {
    const next = { ...alloc, [id]: value };
    setAlloc(next);
    setAmount(String(round2(Object.values(next).reduce((sum, v) => sum + toNumber(v), 0)) || ""));
  };

  const set = (key) => (event) => setFields((previous) => ({ ...previous, [key]: event.target.value }));
  const valid = supplier && total > 0 && !overBill && fields.paid_on;

  const submit = () => {
    const batch = crypto.randomUUID();
    const rows = Object.entries(alloc)
      .filter(([, value]) => toNumber(value) > 0)
      .map(([id, value]) => ({
        bill_id: id,
        supplier_id: supplier,
        batch_id: batch,
        kind,
        amount: round2(toNumber(value)),
        paid_on: fields.paid_on,
        mode: kind === "payment" ? mode : null,
        reference: fields.reference.trim() || null,
        cheque_date: kind === "payment" && mode === "cheque" && fields.cheque_date ? fields.cheque_date : null,
        bank: fields.bank.trim() || null,
        note: fields.note.trim() || null,
        created_by: by.trim() || null,
      }));
    addPayments.mutate(rows, { onSuccess: onClose });
  };

  const isPayment = kind === "payment";
  const referenceLabel = mode === "cheque" ? "Cheque no." : mode === "upi" || mode === "bank" ? "UTR / reference" : "Reference";

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={TITLE[kind]}
      description={HELP[kind]}
      footer={
        <>
          <Button variant="rani" className="press" disabled={!valid || addPayments.isPending} onClick={submit}>
            {addPayments.isPending ? "Saving…" : `Save ${total > 0 ? formatRupees(total) : ""}`.trim()}
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <Field label="Supplier" required>
        {() => (
          <Select value={supplier} onValueChange={changeSupplier}>
            <SelectTrigger><SelectValue placeholder="Pick a supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </Field>

      {supplier && open_.length === 0 && <p className="rounded-xl bg-secondary px-3.5 py-3 text-sm">{supplierById.get(supplier)?.name ?? "This supplier"} has no unpaid bills.</p>}

      {open_.length > 0 && (
        <>
          <Field label={`${isPayment ? "Amount paid" : "Amount"} ₹`} hint={`Owed in total: ${formatRupees(owed)}`}>
            {(id) => <Input id={id} type="number" inputMode="decimal" min={0} value={amount} onChange={(event) => changeAmount(event.target.value)} className="tabular-nums" />}
          </Field>

          <div>
            <p className="eyebrow mb-1.5">Against which bills</p>
            <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-surface">
              {open_.map((bill) => {
                const value = alloc[bill.id] ?? "";
                const bad = toNumber(value) > bill.outstanding + 0.005;
                return (
                  <li key={bill.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">#{bill.bill_no} · {shortDate(bill.bill_date)}</p>
                      <p className={`text-xs tabular-nums ${bill.status === "overdue" ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                        {formatRupees(bill.outstanding)} due · {dueText(bill)}
                      </p>
                    </div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={value}
                      placeholder="0"
                      aria-label={`Amount for bill ${bill.bill_no}`}
                      aria-invalid={bad}
                      onChange={(event) => changeLine(bill.id, event.target.value)}
                      className={`h-9 w-28 text-right tabular-nums ${bad ? "border-destructive" : ""}`}
                    />
                  </li>
                );
              })}
            </ul>
            {overBill && <p role="alert" className="mt-1.5 text-xs text-destructive">More than is owed on bill #{overBill.bill_no}.</p>}
          </div>

          <Field label="Date" required>{(id) => <Input id={id} type="date" value={fields.paid_on} onChange={set("paid_on")} />}</Field>

          {isPayment && (
            <>
              <Field label="Paid by">
                {() => (
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MODES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={referenceLabel}>{(id) => <Input id={id} value={fields.reference} onChange={set("reference")} autoComplete="off" />}</Field>
                {mode === "cheque" ? (
                  <Field label="Cheque date" hint="Leave empty if it is today's.">{(id) => <Input id={id} type="date" value={fields.cheque_date} onChange={set("cheque_date")} />}</Field>
                ) : (
                  mode === "bank" && <Field label="Bank">{(id) => <Input id={id} value={fields.bank} onChange={set("bank")} />}</Field>
                )}
              </div>
              {mode === "cheque" && <Field label="Bank">{(id) => <Input id={id} value={fields.bank} onChange={set("bank")} />}</Field>}
            </>
          )}

          <Field label="Note">{(id) => <TextArea id={id} value={fields.note} onChange={set("note")} placeholder={kind === "return" ? "Which pieces went back" : undefined} />}</Field>
          {!isPayment && <p className="text-xs text-muted-foreground">{KIND_LABEL[kind]} is recorded against the bills above; no cash is involved.</p>}
        </>
      )}
    </ToolSheet>
  );
}
