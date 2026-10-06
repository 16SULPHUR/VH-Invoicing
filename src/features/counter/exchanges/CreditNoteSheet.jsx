import { useEffect, useState } from "react";
import { Printer, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { ToolSheet } from "../components/ToolSheet";
import { MoneyInput, StatusPill } from "../components/Bits";
import { useSaveTool } from "../hooks/useShopTools";
import { usePrintSlip } from "../hooks/usePrintSlip";
import { CREDIT_STATUS, creditBalance, isExpired, isUsable } from "../lib/credit";
import { creditNoteSlip, longDate } from "../lib/slips";
import { formatPhone, rupees, stockMoves } from "../lib/shopTools";

/** A credit note's balance, what it was used on, and using it against a bill. */
export function CreditNoteSheet({ open, note, onClose }) {
  const { toast } = useToast();
  const save = useSaveTool("credit_notes");
  const printSlip = usePrintSlip();
  const [billNo, setBillNo] = useState("");
  const [amount, setAmount] = useState(0);
  const [acceptExpired, setAcceptExpired] = useState(false);
  const [voiding, setVoiding] = useState(null);

  useEffect(() => {
    if (!open || !note) return;
    setBillNo("");
    setAmount(creditBalance(note));
    setAcceptExpired(false);
    setVoiding(null);
  }, [open, note]);

  if (!note) return null;
  const balance = creditBalance(note);
  const expired = isExpired(note);
  const status = CREDIT_STATUS[note.status] ?? CREDIT_STATUS.open;
  const canUse = isUsable(note) && (!expired || acceptExpired);
  const validUse = canUse && Number(billNo) > 0 && amount > 0 && amount <= balance;

  const redeem = () => {
    const redeemed = rupees(note.redeemed) + amount;
    save.mutate(
      {
        record: note,
        row: {
          redeemed,
          redemptions: [...(note.redemptions ?? []), { bill_no: Number(billNo), amount, at: new Date().toISOString() }],
          status: redeemed >= rupees(note.amount) ? "used" : "open",
        },
      },
      {
        onSuccess: (saved) =>
          toast({
            title: `${formatRupees(amount)} used on bill #${billNo}`,
            description: creditBalance(saved) > 0 ? `${formatRupees(creditBalance(saved))} left on ${saved.token}.` : `${saved.token} is fully used.`,
          }),
      }
    );
  };

  const voidNote = () =>
    save.mutate(
      {
        record: note,
        row: { status: "void", note: [note.note, "Voided"].filter(Boolean).join(" · ") },
        moves: voiding.piecesLeft ? stockMoves(note.lines, -1).map((move) => ({ ...move, reason: "exchange_void" })) : [],
      },
      {
        onSuccess: () => {
          toast({ title: `${note.token} voided` });
          onClose();
        },
      }
    );

  const footer = voiding ? (
    <>
      <Button variant="outline" className="press flex-1" onClick={() => setVoiding(null)}>
        Back
      </Button>
      <Button variant="destructive" className="press flex-[2]" disabled={save.isPending} onClick={voidNote}>
        Void {note.token}
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" size="icon" className="press h-10 w-10" onClick={() => printSlip(creditNoteSlip(note))} aria-label="Print credit note">
        <Printer className="h-4 w-4" aria-hidden />
      </Button>
      {isUsable(note) && (
        <Button className="press block-shadow flex-1" disabled={!validUse || save.isPending} onClick={redeem}>
          Use {amount > 0 ? formatRupees(amount) : ""} on bill {billNo ? `#${billNo}` : ""}
        </Button>
      )}
    </>
  );

  return (
    <ToolSheet
      open={open}
      onClose={onClose}
      title={`Credit note ${note.token}`}
      description={`${note.customer_name || "Customer"}${note.customer_phone ? ` · ${formatPhone(note.customer_phone)}` : ""}`}
      badge={<StatusPill solid tone={expired && note.status === "open" ? "red" : status.tone}>{expired && note.status === "open" ? "Expired" : status.label}</StatusPill>}
      footer={footer}
    >
      <div className="motif-overlay rounded-2xl bg-marigold px-4 py-3.5 text-marigold-foreground">
        <p className="eyebrow relative text-marigold-foreground/75">Balance</p>
        <p className="relative mt-1 font-display text-4xl font-extrabold tabular-nums leading-none">{formatRupees(balance)}</p>
        <p className="relative mt-1.5 text-sm">
          of {formatRupees(note.amount)} · issued {formatDateDDMMMYYYY(note.created_at)} ·{" "}
          {note.expires_on ? `valid till ${longDate(note.expires_on)}` : "no expiry"}
        </p>
      </div>

      {voiding ? (
        <div className="space-y-3 text-sm">
          <p>Void this credit note if it was issued by mistake. It can no longer be used.</p>
          {note.lines.some((line) => line.product_id) && (
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3">
              <Checkbox checked={voiding.piecesLeft} onCheckedChange={(value) => setVoiding({ piecesLeft: value === true })} className="mt-0.5" />
              <span>
                <b>The pieces went back to the customer</b>
                <span className="block text-xs text-muted-foreground">Takes them out of stock again.</span>
              </span>
            </label>
          )}
        </div>
      ) : (
        <>
          {isUsable(note) && (
            <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <p className="font-display text-base font-bold">Use against a bill</p>
              {expired && (
                <label className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">Expired on {longDate(note.expires_on)}.</span>
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Checkbox checked={acceptExpired} onCheckedChange={(value) => setAcceptExpired(value === true)} /> Accept anyway
                  </span>
                </label>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Bill number" htmlFor="credit-bill">
                  <Input id="credit-bill" inputMode="numeric" value={billNo} onChange={(event) => setBillNo(event.target.value.replace(/\D/g, ""))} />
                </Field>
                <Field label="Amount" htmlFor="credit-amount" error={amount > balance ? `Only ${formatRupees(balance)} left` : null}>
                  <MoneyInput id="credit-amount" value={amount} onChange={setAmount} />
                </Field>
              </div>
              <p className="rounded-xl border-l-4 border-rani bg-accent px-3 py-2 text-xs leading-relaxed">
                At the till, bill the new pieces as usual and put the credit note amount in the <b>Cash</b> box of the
                payment, with the rest paid as cash, UPI or credit. The till does not know about credit notes, so the
                cash count for the day will be higher by this amount.
              </p>
            </section>
          )}

          {note.lines.length > 0 && (
            <section className="space-y-1.5">
              <p className="eyebrow">Taken back{note.source_bill ? ` from bill #${note.source_bill}` : ""}</p>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface text-sm">
                {note.lines.map((line) => (
                  <li key={line.key} className="flex justify-between gap-3 px-3 py-2">
                    <span className="truncate">
                      {line.name} <span className="text-muted-foreground">×{line.quantity}</span>
                    </span>
                    <span className="tabular-nums">{formatRupees(line.price * line.quantity)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(note.redemptions ?? []).length > 0 && (
            <section className="space-y-1.5">
              <p className="eyebrow">Used</p>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface text-sm">
                {note.redemptions.map((use) => (
                  <li key={use.at} className="flex justify-between gap-3 px-3 py-2">
                    <span>
                      Bill #{use.bill_no} <span className="text-muted-foreground">· {formatDateDDMMMYYYY(use.at)}</span>
                    </span>
                    <span className="tabular-nums">{formatRupees(use.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {note.note && <p className="rounded-xl bg-surface-elevated px-3 py-2 text-sm">{note.note}</p>}

          {note.status === "open" && rupees(note.redeemed) === 0 && (
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setVoiding({ piecesLeft: false })}>
              Void this credit note
            </Button>
          )}
        </>
      )}
    </ToolSheet>
  );
}
