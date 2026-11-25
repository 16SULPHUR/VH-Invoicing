import { ExternalLink, PackagePlus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/utils/formatters";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { KIND_LABEL, dueText, modeLabel, shortDate } from "../lib/billMath";
import { useSupplierBookMutations } from "../hooks/useSupplierBooks";
import { StatusChip, } from "./Chip";

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function BillSheet({ bill, supplier, onClose, onEdit, onPay }) {
  const navigate = useNavigate();
  const { deleteBill, deletePayment, markStockReceived } = useSupplierBookMutations();
  if (!bill) return <ToolSheet open={false} onClose={onClose} />;

  const receiveStock = () => {
    markStockReceived.mutate(bill.id);
    navigate("/inventory?tab=add", { state: { supplier: supplier?.id } });
  };

  const remove = () => {
    if (window.confirm(`Remove bill #${bill.bill_no} and its ${bill.payments.length} payment entries?`)) {
      deleteBill.mutate(bill.id, { onSuccess: onClose });
    }
  };

  return (
    <ToolSheet
      open
      onClose={onClose}
      title={`Bill #${bill.bill_no}`}
      description={supplier?.name ?? "Unknown supplier"}
      badge={<StatusChip status={bill.status} />}
      footer={
        bill.outstanding > 0 ? (
          <>
            <Button variant="rani" className="press" onClick={() => onPay("payment")}>Pay {formatRupees(bill.outstanding)}</Button>
            <Button variant="outline" onClick={() => onPay("return")}>Goods return</Button>
            <Button variant="outline" onClick={() => onPay("discount")}>Kasar</Button>
          </>
        ) : null
      }
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Bill total", formatRupees(bill.total), ""],
          ["Settled", formatRupees(bill.paid + bill.returned + bill.discount), "text-leaf"],
          ["Still owed", formatRupees(Math.max(bill.outstanding, 0)), bill.outstanding > 0 ? "text-destructive" : ""],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-xl bg-secondary px-2 py-2.5">
            <p className="eyebrow">{label}</p>
            <p className={`mt-1 font-display text-lg font-bold tabular-nums ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <dl className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-surface px-3.5">
        <Row label="Bill date" value={shortDate(bill.bill_date)} />
        <Row label="Due" value={`${shortDate(bill.due_date)} · ${dueText(bill)}`} />
        <Row label="Taxable" value={formatRupees(bill.taxable_amount)} />
        <Row label={`GST ${Number(bill.gst_rate)}%${bill.igst ? " (IGST)" : ""}`} value={formatRupees(bill.gst_amount)} />
        {bill.hsn && <Row label="HSN" value={bill.hsn} />}
        {supplier?.gstin && <Row label="Supplier GSTIN" value={supplier.gstin} />}
      </dl>
      {bill.note && <p className="rounded-xl bg-secondary px-3.5 py-3 text-sm">{bill.note}</p>}

      <section>
        <p className="eyebrow mb-1.5">Payments and adjustments</p>
        {bill.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border/70 rounded-2xl border border-border/70 bg-surface">
            {bill.payments.map((payment) => (
              <li key={payment.id} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">
                    {KIND_LABEL[payment.kind]}
                    {payment.mode && ` · ${modeLabel(payment.mode)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(payment.paid_on)}
                    {payment.reference && ` · ${payment.mode === "cheque" ? "Cheque" : "Ref"} ${payment.reference}`}
                    {payment.cheque_date && ` dated ${shortDate(payment.cheque_date)}`}
                    {payment.bank && ` · ${payment.bank}`}
                    {payment.created_by && ` · by ${payment.created_by}`}
                  </p>
                  {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="font-semibold tabular-nums">{formatRupees(payment.amount)}</span>
                  <button
                    type="button"
                    className="press rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove this entry"
                    onClick={() => window.confirm("Remove this entry?") && deletePayment.mutate(payment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {bill.photo_url && (
        <a href={bill.photo_url} target="_blank" rel="noreferrer" className="block">
          <img src={bill.photo_url} alt="Paper bill" className="max-h-72 w-full rounded-xl border border-border bg-surface object-contain" />
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo"><ExternalLink className="h-3 w-3" aria-hidden /> Open full size</span>
        </a>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Button>
        <Button variant="outline" size="sm" onClick={receiveStock} disabled={!supplier}>
          <PackagePlus className="h-3.5 w-3.5" aria-hidden /> {bill.stock_received_at ? "Receive more stock" : "Receive stock"}
        </Button>
        <Button variant="outline" size="sm" className="text-destructive" onClick={remove}><Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove</Button>
      </div>
      {bill.stock_received_at && <p className="text-xs text-muted-foreground">Stock marked received on {shortDate(bill.stock_received_at.slice(0, 10))}.</p>}
    </ToolSheet>
  );
}
