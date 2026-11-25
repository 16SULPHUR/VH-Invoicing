import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ReceiptIndianRupee, RefreshCw, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { formatRupees } from "@/utils/formatters";
import { formatPhone } from "../lib/shopTools";

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl bg-surface-elevated px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="eyebrow">{label}</p>
        <p className="break-words text-sm font-semibold">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => setCopied(true), () => {});
        }}
        className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-secondary"
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        {copied ? <Check className="h-4 w-4 text-leaf" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

/**
 * What was put on the till's scan list, what the till needs typed by hand, and a place to
 * record the bill number once the bill is printed.
 */
export function TillHandoff(props) {
  // Mounted per handoff, so a bill number typed for the last one never carries over.
  return props.handoff ? <HandoffDialog {...props} /> : null;
}

function HandoffDialog({ handoff, onClose, onRetry, onBillNo, retrying }) {
  const [billNo, setBillNo] = useState("");
  const { sent = [], manual = [], failed, customer, note, paidBefore = 0, paidLabel } = handoff;
  const tillParams = new URLSearchParams(
    Object.entries({ name: customer?.name, phone: customer?.phone, note }).filter(([, value]) => value)
  ).toString();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] max-w-md gap-3 overflow-y-auto rounded-2xl p-5">
        <DialogTitle className="flex items-center gap-2 font-display text-xl font-extrabold">
          <ReceiptIndianRupee className="h-5 w-5 text-rani" aria-hidden /> Bill it at the till
        </DialogTitle>
        <DialogDescription>
          {failed
            ? "Saved here, but the pieces could not be put on the till's scan list."
            : sent.length > 0
              ? "These pieces are on the till's scan list now. Open the till and they appear on the bill."
              : "Nothing could go on the scan list. Add these on the till by hand."}
        </DialogDescription>

        {failed && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{failed}</span>
            <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
            </Button>
          </div>
        )}

        {sent.length > 0 && (
          <ul className="space-y-1 text-sm">
            {sent.map((line) => (
              <li key={line.key} className="flex justify-between gap-3">
                <span className="truncate">
                  {line.name} <span className="text-muted-foreground">×{line.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatRupees(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
        )}

        {manual.length > 0 && (
          <div className="space-y-1">
            <p className="eyebrow">Type these on the till</p>
            <ul className="space-y-1 text-sm">
              {manual.map((line) => (
                <li key={line.key} className="flex justify-between gap-3 rounded-lg bg-marigold/15 px-2 py-1">
                  <span className="truncate">
                    {line.name} <span className="text-muted-foreground">×{line.quantity}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatRupees(line.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CopyRow label="Customer" value={[customer?.name, formatPhone(customer?.phone)].filter(Boolean).join(" · ")} />
        <CopyRow label="Note for the bill" value={note} />

        {paidBefore > 0 && (
          <p className="rounded-xl border-l-4 border-rani bg-accent px-3 py-2 text-sm">
            <b>{formatRupees(paidBefore)}</b> {paidLabel}. Put it in the till&apos;s <b>Cash</b> box with the rest of
            the payment, so the bill adds up.
          </p>
        )}

        {onBillNo && (
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (Number(billNo) > 0) onBillNo(Number(billNo));
            }}
          >
            <Field label="Bill number, once printed" htmlFor="handoff-bill" className="flex-1">
              <Input id="handoff-bill" inputMode="numeric" value={billNo} onChange={(event) => setBillNo(event.target.value.replace(/\D/g, ""))} />
            </Field>
            <Button type="submit" variant="outline" disabled={!billNo}>
              Save
            </Button>
          </form>
        )}

        <div className="flex gap-2 pt-1">
          <Button asChild variant="outline" className="flex-1">
            <Link to={tillParams ? `/?${tillParams}` : "/"}>Open the till</Link>
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
