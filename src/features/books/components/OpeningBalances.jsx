import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { localISODate } from "@/utils/date";
import { formatINR, toNumber } from "@/utils/formatters";

/** Cash and bank the shop held when the books begin, posted once against Capital. */
export function OpeningBalances() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(localISODate());
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");

  const existing = useQuery({ queryKey: queryKeys.books.opening, queryFn: () => booksService.openingBalances() });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounting.trialBalance });
  };

  const save = useMutation({
    mutationFn: () => {
      const cashAmount = toNumber(cash);
      const bankAmount = toNumber(bank);
      return booksService.postJournal({
        date,
        description: "Opening balance",
        lines: [
          { account: "Cash", amount: cashAmount },
          { account: "Bank", amount: bankAmount },
          { account: "Capital", amount: -(cashAmount + bankAmount) },
        ].filter((line) => line.amount !== 0),
      });
    },
    onSuccess: () => {
      refresh();
      setCash("");
      setBank("");
      toast({ title: "Opening balances saved" });
    },
    onError: (error) => toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id) => booksService.deleteJournal(id),
    onSuccess: () => {
      refresh();
      toast({ title: "Opening balances removed" });
    },
    onError: (error) => toast({ title: "Could not remove", description: error.message, variant: "destructive" }),
  });

  const saved = existing.data?.filter((row) => row.account_name !== "Capital") ?? [];
  const savedId = saved[0]?.transaction_id;
  const empty = toNumber(cash) === 0 && toNumber(bank) === 0;

  return (
    <>
      {saved.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-surface p-4">
          {saved.map((row) => (
            <div key={row.account_name} className="flex justify-between">
              <span>{row.account_name}</span>
              <span className="font-semibold tabular-nums">{formatINR(row.debit - row.credit)}</span>
            </div>
          ))}
          <Button
            variant="outline"
            className="press"
            onClick={() => window.confirm("Remove the opening balances so you can enter them again?") && remove.mutate(savedId)}
          >
            Remove and re-enter
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border/70 bg-surface p-4">
          <Field label="As on" htmlFor="opening-date">
            {(id) => <Input id={id} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
          </Field>
          <Field label="Cash in hand ₹" htmlFor="opening-cash">
            {(id) => <Input id={id} type="number" inputMode="decimal" value={cash} onChange={(event) => setCash(event.target.value)} />}
          </Field>
          <Field label="Bank balance ₹" htmlFor="opening-bank">
            {(id) => <Input id={id} type="number" inputMode="decimal" value={bank} onChange={(event) => setBank(event.target.value)} />}
          </Field>
          <Button onClick={() => save.mutate()} disabled={empty || !date || save.isPending} className="block-shadow w-full">
            {save.isPending ? "Saving…" : "Save opening balances"}
          </Button>
        </div>
      )}
    </>
  );
}
