import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { cashbookService } from "@/services/cashbookService";
import { localISODate } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";
import { balanceAsOf } from "../balances";
import { PAYOUT_REASONS, payoutDescription, payoutReason } from "../history";
import { useEnteredBy } from "../hooks/useEnteredBy";
import { EnteredByField } from "./EnteredByField";

const DETAIL_LABEL = {
  "Bank deposit": "Bank / note",
  Person: "Paid to",
  Expense: "What for",
  Other: "Note",
};

export function PayoutDialog({ open, onOpenChange, cashbook }) {
  const { toast } = useToast();
  const { transactions, reconciliations, accountIdByName, invalidate } = cashbook;
  const [reason, setReason] = useState("Bank deposit");
  const [amount, setAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [by, setBy] = useEnteredBy();

  const homeId = accountIdByName("HOME");
  const today = localISODate();
  const home = homeId ? balanceAsOf({ transactions, reconciliations }, homeId, today) : 0;
  const value = toNumber(amount);

  const people = useMemo(() => {
    const names = new Set();
    for (const row of transactions) {
      const parsed = payoutReason(row);
      if (row.amount < 0 && parsed.label === "Person" && parsed.detail) names.add(parsed.detail);
    }
    return [...names];
  }, [transactions]);

  const problem =
    value > home
      ? `Home only has ${formatRupees(home)}.`
      : value > 0 && !by.trim()
        ? "Enter who is paying."
        : null;

  const save = useMutation({
    mutationFn: () =>
      cashbookService.addTransaction({
        account_id: homeId,
        txn_date: today,
        amount: -value,
        type: reason === "Bank deposit" ? "bank_deposit" : "outflow",
        description: payoutDescription(reason, detail),
        author: by.trim(),
      }),
    onSuccess: () => {
      invalidate();
      setAmount("");
      setDetail("");
      onOpenChange(false);
      toast({ title: "Payout saved" });
    },
    onError: (error) =>
      toast({ title: "Could not save payout", description: error.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay out from Home</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div role="radiogroup" aria-label="Reason" className="grid grid-cols-2 gap-2">
            {PAYOUT_REASONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={reason === option}
                onClick={() => setReason(option)}
                className={`h-11 rounded-xl border-[1.5px] text-sm font-bold transition-colors ${
                  reason === option
                    ? "border-rani bg-rani/10 text-rani"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <Field label="Amount ₹" htmlFor="payout-amount">
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-14 text-right font-display text-2xl font-extrabold tabular-nums"
                autoFocus
              />
            )}
          </Field>

          <Field label={DETAIL_LABEL[reason]} htmlFor="payout-detail">
            {(id) => (
              <Input
                id={id}
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                list="payout-people"
                autoComplete="off"
              />
            )}
          </Field>
          {reason === "Person" && (
            <datalist id="payout-people">
              {people.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          )}

          <EnteredByField value={by} onChange={setBy} />

          {value > 0 && (
            <p className="rounded-xl bg-surface-elevated px-3.5 py-2.5 text-sm font-semibold tabular-nums">
              Home {formatRupees(home)} − {formatRupees(value)} = {formatRupees(home - value)}
            </p>
          )}
          {problem && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {problem}
            </p>
          )}

          <Button
            onClick={() => save.mutate()}
            disabled={!value || value < 0 || Boolean(problem) || save.isPending || !homeId}
            className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold"
          >
            {save.isPending ? "Saving…" : "Save payout"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
