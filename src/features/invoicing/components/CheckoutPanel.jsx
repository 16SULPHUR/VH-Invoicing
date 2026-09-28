import { Check, FilePen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteField } from "./NoteField";
import { PaymentDetails } from "./PaymentDetails";
import { formatRupees, toNumber } from "@/utils/formatters";
import { paymentsTotal } from "@/utils/invoice";
import { ICON_STROKE } from "@/config/navigation";

/**
 * The checkout column stays in view while the operator works the left side, so
 * the total, the split and the action are never more than a glance away.
 */
export function CheckoutPanel({ draft, onSubmit, children }) {
  const total = toNumber(draft.total);
  const paid = paymentsTotal(draft.payments);
  const balance = total - paid;
  const settled = Math.abs(balance) < 0.01;
  const unpaid = paid === 0;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-surface p-5 md:border-l-[1.5px] md:border-border">
      <div className="motif-overlay rounded-3xl bg-rani px-5 pb-5 pt-4 text-rani-foreground">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
          Total · {draft.itemCount} {draft.itemCount === 1 ? "item" : "items"}
        </p>
        <p className="mt-1 break-all font-display text-[56px] font-extrabold leading-none tracking-tight tabular-nums">
          {formatRupees(total)}
        </p>
        <p className="mt-1 truncate text-sm font-semibold opacity-90">
          {draft.customerName || "Walk-in customer"}
        </p>
      </div>

      <PaymentDetails
        payments={draft.payments}
        setPayment={draft.setPayment}
        onAssignFullAmount={draft.assignFullAmountTo}
      />

      <div
        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold ${
          unpaid
            ? "bg-secondary text-muted-foreground"
            : settled
              ? "bg-success/10 text-success"
              : "bg-marigold/15 text-warning"
        }`}
      >
        <span>{unpaid ? "Not paid yet" : settled ? "Settled" : balance > 0 ? "Still to collect" : "Paid too much"}</span>
        {settled && !unpaid ? (
          <Check size={17} strokeWidth={2.4} aria-hidden />
        ) : (
          <span className="tabular-nums">{unpaid ? "" : formatRupees(Math.abs(balance))}</span>
        )}
      </div>

      <NoteField note={draft.note} setNote={draft.setNote} />

      <div className="mt-auto pt-2">
        <Button
          type="button"
          onClick={onSubmit}
          size="lg"
          className="block-shadow h-14 w-full rounded-2xl font-display text-lg font-extrabold"
        >
          {draft.isEditing ? (
            <FilePen size={19} strokeWidth={ICON_STROKE} aria-hidden />
          ) : (
            <Printer size={19} strokeWidth={ICON_STROKE} aria-hidden />
          )}
          {draft.isEditing ? "Update bill" : "Print bill"}
          <kbd className="ml-1 rounded-md border border-white/30 px-1.5 font-sans text-[11px] font-semibold opacity-80">
            F1
          </kbd>
        </Button>
      </div>

      {children}
    </aside>
  );
}
