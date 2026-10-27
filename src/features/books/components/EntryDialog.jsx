import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { localISODate } from "@/utils/date";
import { toNumber } from "@/utils/formatters";
import { useBooksSettings } from "../booksSettings";
import { ENTRY_KINDS, SOURCE_OPTIONS, entryDescription, entryLines } from "../lib/entryKinds";
import { SelectField } from "./SelectField";

export function EntryDialog({ open, onOpenChange, defaultKind = "expense", defaultSource, kinds }) {
  const { books } = useBooksSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const options = ENTRY_KINDS.filter((item) => !kinds || kinds.includes(item.value));
  const [kind, setKind] = useState(defaultKind);
  const [source, setSource] = useState(defaultSource ?? books.default_source);
  const [date, setDate] = useState(localISODate());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("");

  const selected = options.find((item) => item.value === kind) ?? options[0];
  const value = toNumber(amount);

  const save = useMutation({
    mutationFn: () =>
      booksService.postJournal({
        date,
        description: entryDescription(selected, category, note),
        lines: entryLines(selected.value, source, value),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.ledger });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounting.trialBalance });
      setAmount("");
      setNote("");
      onOpenChange(false);
      toast({ title: "Entry saved" });
    },
    onError: (error) =>
      toast({ title: "Could not save entry", description: error.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SelectField label="What happened" value={selected.value} onChange={setKind} options={options} htmlFor="entry-kind" />
          {selected.value === "expense" && (
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              htmlFor="entry-category"
              options={[{ value: "", label: "No category" }, ...books.expense_categories.map((name) => ({ value: name, label: name }))]}
            />
          )}
          {selected.needsSource && (
            <SelectField label="Through" value={source} onChange={setSource} options={SOURCE_OPTIONS} htmlFor="entry-source" />
          )}
          <Field label="Amount ₹" htmlFor="entry-amount">
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="entry-date">
              {(id) => <Input id={id} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
            </Field>
            <Field label="Note" htmlFor="entry-note">
              {(id) => <Input id={id} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Rent, tea…" autoComplete="off" />}
            </Field>
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={value <= 0 || !date || save.isPending}
            className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold"
          >
            {save.isPending ? "Saving…" : "Save entry"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
