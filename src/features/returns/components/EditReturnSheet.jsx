import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { formatRupees, toNumber } from "@/utils/formatters";
import { ToolSheet } from "@/features/counter/components/ToolSheet";
import { Chips } from "@/features/counter/components/Chips";
import { MoneyInput, TextArea } from "@/features/counter/components/Bits";
import { EXPIRY_CHOICES } from "@/features/counter/lib/credit";
import { longDateYear } from "@/features/counter/lib/slips";
import { addDays, todayLocal } from "@/features/counter/lib/shopTools";
import { useEditReturn } from "../hooks/useBillReturns";

/** Change how a return was refunded, when its store credit runs out, and the reason. Items stay as they were. */
export function EditReturnSheet({ open, note, invoice, onClose, onSaved }) {
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();
  const edit = useEditReturn(invoice);
  const [refund, setRefund] = useState({ cash: 0, upi: 0, due: 0 });
  const [expiry, setExpiry] = useState("keep");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || !note) return;
    setRefund({ cash: toNumber(note.refund_cash), upi: toNumber(note.refund_upi), due: toNumber(note.refund_due) });
    setExpiry(note.expires_on ? "keep" : 0);
    setReason(note.note ?? "");
  }, [open, note]);

  if (!note) return null;

  const amount = toNumber(note.amount);
  const redeemed = toNumber(note.redeemed);
  const maxDue = Math.max(0, toNumber(invoice.credit)) + toNumber(note.refund_due);
  const store = amount - refund.cash - refund.upi - refund.due;
  const options = [...(note.expires_on ? [{ value: "keep", label: `Keep ${longDateYear(note.expires_on)}` }] : []), ...EXPIRY_CHOICES];

  const error = !isOnline
    ? "You are offline. Changes need a connection."
    : store < 0
      ? `The refunds add up to ${formatRupees(-store)} more than the goods.`
      : store < redeemed
        ? `${formatRupees(redeemed)} of store credit was already used, so at least that much must stay as store credit.`
        : null;

  const setField = (key, value) => setRefund((previous) => ({ ...previous, [key]: key === "due" ? Math.min(value, maxDue) : value }));

  const save = async () => {
    let expiresOn = null;
    if (store > 0) expiresOn = expiry === "keep" ? note.expires_on : expiry ? addDays(todayLocal(), expiry) : null;
    try {
      await edit.mutateAsync({ note, cash: refund.cash, upi: refund.upi, due: refund.due, expiresOn, reason: reason.trim() });
      toast({ title: `${note.token} updated` });
      onSaved?.();
      onClose();
    } catch {
      // the mutation already told the user
    }
  };

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={`Edit ${note.token}`}
      description={`Returned ${formatRupees(amount)} from bill #${invoice.id}. To change the items, delete the return and make a new one.`}
      footer={
        <>
          {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
          <Button className="press block-shadow w-full" disabled={Boolean(error) || edit.isPending} onClick={save}>
            <Check className="h-4 w-4" aria-hidden /> {edit.isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <p className="font-display text-base font-bold">How it was refunded</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cash back" htmlFor="edit-return-cash">
            <MoneyInput id="edit-return-cash" value={refund.cash} onChange={(value) => setField("cash", value)} />
          </Field>
          <Field label="UPI back" htmlFor="edit-return-upi">
            <MoneyInput id="edit-return-upi" value={refund.upi} onChange={(value) => setField("upi", value)} />
          </Field>
          <Field label="Off the bill's due" htmlFor="edit-return-due" hint={`Up to ${formatRupees(maxDue)}`}>
            <MoneyInput id="edit-return-due" value={refund.due} onChange={(value) => setField("due", value)} disabled={maxDue === 0} />
          </Field>
          <Field label="Store credit" htmlFor="edit-return-credit" hint="Whatever is left over">
            <MoneyInput id="edit-return-credit" value={Math.max(0, store)} onChange={() => {}} readOnly />
          </Field>
        </div>
        {store > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Store credit valid till</p>
            <Chips label="Valid till" value={expiry} onChange={setExpiry} options={options} />
          </div>
        )}
      </section>
      <Field label="Reason" htmlFor="edit-return-reason">
        <TextArea id="edit-return-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
    </ToolSheet>
  );
}
