import { FilePen, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteField } from "./NoteField";
import { PaymentDetails } from "./PaymentDetails";
import { formatAmount, toNumber } from "@/utils/formatters";
import { paymentsTotal } from "@/utils/invoice";
import { ICON_STROKE } from "@/config/navigation";

/**
 * The checkout column stays in view while the operator works the left side, so
 * the total, the split and the action are never more than a glance away.
 */
export function CheckoutPanel({ draft, onSubmit }) {
  const total = toNumber(draft.total);
  const paid = paymentsTotal(draft.payments);
  const balance = total - paid;
  const settled = Math.abs(balance) < 0.01;
  const unpaid = paid === 0;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 border-border bg-surface p-4 md:border-l">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Amount due
        </p>
        <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-foreground">
          ₹{formatAmount(total)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {draft.itemCount} {draft.itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment</p>
        <PaymentDetails
          payments={draft.payments}
          setPayment={draft.setPayment}
          onAssignFullAmount={draft.assignFullAmountTo}
        />
      </div>

      <div
        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
          unpaid
            ? "border-border bg-background text-muted-foreground"
            : settled
              ? "border-success/40 bg-success/10 text-success"
              : "border-warning/40 bg-warning/10 text-warning"
        }`}
      >
        <span>{unpaid ? "Unpaid" : settled ? "Settled" : "Balance"}</span>
        <span className="font-semibold tabular-nums">
          {unpaid ? "-" : `₹${formatAmount(Math.abs(balance))}`}
        </span>
      </div>

      <NoteField note={draft.note} setNote={draft.setNote} />

      <div className="mt-auto pt-2">
        <Button
          type="button"
          onClick={onSubmit}
          size="lg"
          className="press h-12 w-full text-base"
          variant={draft.isEditing ? "secondary" : "default"}
        >
          {draft.isEditing ? (
            <>
              <FilePen size={18} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
              Update invoice
            </>
          ) : (
            <>
              <Printer size={18} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
              Generate invoice
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Or press <kbd className="rounded border border-border bg-background px-1">F1</kbd>
        </p>
      </div>
    </aside>
  );
}
