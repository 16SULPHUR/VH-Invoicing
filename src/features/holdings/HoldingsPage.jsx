import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { Field } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { PageLoader } from "@/components/common/PageLoader";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import { booksService } from "@/services/booksService";
import { formatDateDDMMMYYYY, localISODate } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";
import { SelectField } from "@/features/books/components/SelectField";
import { useEnteredBy } from "@/features/books/useEnteredBy";

const PLACES = [
  { value: "home", label: "Home" },
  { value: "shop", label: "Shop" },
];
const placeName = (value) => PLACES.find((place) => place.value === value)?.label ?? value;
const MODES = [
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
  { value: "transfer", label: "Move between" },
  { value: "count", label: "Set counted amount" },
];
const KIND_LABEL = { opening: "Opening", in: "In", out: "Out", transfer: "Moved", correction: "Counted" };

function EntryDialog({ open, onOpenChange, balances, initialMode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(initialMode);
  const [place, setPlace] = useState("shop");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(localISODate());
  const [note, setNote] = useState("");
  const [author, setAuthor] = useEnteredBy();

  const value = toNumber(amount);
  const other = place === "shop" ? "home" : "shop";
  const target = other;

  const save = useMutation({
    mutationFn: () => {
      const base = { entry_date: date, note: note.trim() || null, author: author.trim() || null };
      if (mode === "transfer") {
        const transferId = crypto.randomUUID();
        return booksService.addHoldings([
          { ...base, location: place, amount: -value, kind: "transfer", transfer_id: transferId },
          { ...base, location: target, amount: value, kind: "transfer", transfer_id: transferId },
        ]);
      }
      if (mode === "count") {
        return booksService.addHoldings([{ ...base, location: place, amount: value - (balances[place] ?? 0), kind: "correction" }]);
      }
      return booksService.addHoldings([{ ...base, location: place, amount: mode === "out" ? -value : value, kind: mode }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.holdings });
      setAmount("");
      setNote("");
      onOpenChange(false);
      toast({ title: "Saved" });
    },
    onError: (error) => toast({ title: "Could not save", description: error.message, variant: "destructive" }),
  });

  const problem =
    (mode === "out" || mode === "transfer") && value > (balances[place] ?? 0)
      ? `${placeName(place)} only has ${formatRupees(balances[place] ?? 0)}.`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Home & Shop</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SelectField label="What happened" value={mode} onChange={setMode} options={MODES} htmlFor="holding-mode" />
          <SelectField label={mode === "transfer" ? "From" : "Where"} value={place} onChange={setPlace} options={PLACES} htmlFor="holding-place" />
          {mode === "transfer" && <p className="text-sm text-muted-foreground">Goes to {placeName(target)}.</p>}
          <Field label={mode === "count" ? "Counted amount ₹" : "Amount ₹"} htmlFor="holding-amount">
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
          {mode === "count" && amount !== "" && (
            <p className="text-sm text-muted-foreground">
              Books say {formatRupees(balances[place] ?? 0)}. This records a difference of {formatRupees(value - (balances[place] ?? 0))}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="holding-date">
              {(id) => <Input id={id} type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
            </Field>
            <Field label="By (optional)" htmlFor="holding-by">
              {(id) => <Input id={id} value={author} onChange={(event) => setAuthor(event.target.value)} autoComplete="off" />}
            </Field>
          </div>
          <Field label="Note (optional)" htmlFor="holding-note">
            {(id) => <Input id={id} value={note} onChange={(event) => setNote(event.target.value)} autoComplete="off" />}
          </Field>
          {problem && <p role="alert" className="text-sm font-semibold text-destructive">{problem}</p>}
          <Button
            onClick={() => save.mutate()}
            disabled={(mode === "count" ? amount === "" : value <= 0) || !date || Boolean(problem) || save.isPending}
            className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold"
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HoldingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [filter, setFilter] = useState("all");

  const { data, isLoading, error } = useQuery({ queryKey: queryKeys.books.holdings, queryFn: () => booksService.holdings() });

  const remove = useMutation({
    mutationFn: (entry) => booksService.deleteHolding(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.holdings });
      toast({ title: "Entry deleted" });
    },
    onError: (err) => toast({ title: "Could not delete", description: err.message, variant: "destructive" }),
  });

  const balances = useMemo(() => {
    const totals = { home: 0, shop: 0 };
    (data ?? []).forEach((entry) => {
      totals[entry.location] = (totals[entry.location] ?? 0) + (Number(entry.amount) || 0);
    });
    return totals;
  }, [data]);

  const rows = (data ?? []).filter((entry) => filter === "all" || entry.location === filter);

  if (isLoading) return <PageLoader />;

  return (
    <div className="mx-auto flex h-full max-w-[1100px] flex-col gap-4 overflow-y-auto p-4">
      <PageHeader
        title="Home & Shop"
        subtitle="Where the cash is right now"
        actions={
          data && (
            <div className="flex flex-wrap gap-2">
              <Button className="block-shadow press" onClick={() => setDialog("in")}>
                <Plus size={16} className="mr-1.5" aria-hidden />
                Add entry
              </Button>
              <Button variant="outline" className="press" onClick={() => setDialog("transfer")}>
                <ArrowLeftRight size={16} className="mr-1.5" aria-hidden />
                Move
              </Button>
              <Button variant="outline" className="press" onClick={() => setDialog("count")}>
                <Scale size={16} className="mr-1.5" aria-hidden />
                Set count
              </Button>
            </div>
          )
        }
      />

      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
      {data === null && (
        <EmptyState title="Not set up yet" description="Run docs/schema/books.sql in Supabase to turn this page on." />
      )}

      {data && (
        <>
          {dialog && <EntryDialog key={dialog} open onOpenChange={(open) => !open && setDialog(null)} balances={balances} initialMode={dialog} />}
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Home", balances.home, "bg-rani text-white"],
              ["Shop", balances.shop, "bg-leaf text-white"],
              ["Total", balances.home + balances.shop, "bg-indigo text-white"],
            ].map(([label, value, tone]) => (
              <div key={label} className={`motif-overlay rounded-[1.25rem] px-4 py-3.5 sm:px-5 sm:py-4 ${tone}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">{label}</p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums leading-none tracking-tight sm:text-[2.1rem]">
                  {formatRupees(value)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">History</h2>
            <div className="w-40">
              <SelectField label="Show" value={filter} onChange={setFilter} options={[{ value: "all", label: "Both" }, ...PLACES]} htmlFor="holding-filter" />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No entries yet" description="Add what is at home and at the shop, then keep it up to date." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-surface-elevated hover:bg-surface-elevated">
                      <TableHead>Date</TableHead>
                      <TableHead>Where</TableHead>
                      <TableHead>What</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatDateDDMMMYYYY(entry.entry_date)}</TableCell>
                        <TableCell>{placeName(entry.location)}</TableCell>
                        <TableCell>{KIND_LABEL[entry.kind] ?? entry.kind}</TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${entry.amount < 0 ? "text-rani" : "text-leaf"}`}>
                          {entry.amount > 0 ? "+" : ""}
                          {formatRupees(entry.amount)}
                        </TableCell>
                        <TableCell>{entry.note}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.author}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            aria-label="Delete entry"
                            className="press text-muted-foreground hover:text-destructive"
                            onClick={() => window.confirm("Delete this entry?") && remove.mutate(entry)}
                          >
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
