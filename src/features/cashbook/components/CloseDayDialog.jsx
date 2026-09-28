import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { useCloseDay } from "../hooks/useCloseDay";

function Row({ label, value, hint, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={`tabular-nums ${strong ? "font-display text-xl font-extrabold" : "font-semibold"}`}
      >
        {value}
      </span>
    </div>
  );
}

export function CloseDayDialog({ open, onOpenChange, cashbook }) {
  const day = useCloseDay({ ...cashbook, enabled: open });
  const settled = Math.abs(day.difference) < 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close the day · {formatDateDDMMMYYYY(day.today)}</DialogTitle>
        </DialogHeader>

        {!day.hasDrawer ? (
          <p className="text-sm text-muted-foreground">The cashbook has no SHOP account yet.</p>
        ) : day.error ? (
          <p className="text-sm text-destructive">
            Could not load today&apos;s takings: {day.error.message}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-border rounded-2xl bg-surface-elevated px-4 py-2 text-sm">
              <Row
                label="Shop balance"
                hint="Last count plus today's cashbook entries"
                value={formatRupees(day.opening)}
              />
              <Row
                label="Cash from today's bills"
                hint={`${day.billCount} ${day.billCount === 1 ? "bill" : "bills"}`}
                value={day.isLoading ? "…" : formatRupees(day.billCash)}
              />
              <Row
                label="Cash collected on credit"
                hint={
                  day.collectionsTracked ? null : "Not tracked until credit payments are set up"
                }
                value={day.isLoading ? "…" : formatRupees(day.collected)}
              />
              <Row label="Should be in the drawer" value={formatRupees(day.expected)} strong />
            </div>

            <Field label="Cash counted in the drawer" htmlFor="close-day-counted">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={day.counted}
                  onChange={(event) => day.setCounted(event.target.value)}
                  className="h-12 text-right font-display text-xl font-extrabold tabular-nums"
                  autoFocus
                />
              )}
            </Field>

            {day.hasCount && (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-sm font-bold ${
                  settled ? "bg-success/10 text-success" : "bg-marigold/15 text-warning"
                }`}
              >
                {settled
                  ? "Drawer matches."
                  : `${formatRupees(Math.abs(day.difference))} ${day.difference > 0 ? "extra" : "short"}.`}
              </p>
            )}

            <Button
              onClick={() => day.save.mutate(undefined, { onSuccess: () => onOpenChange(false) })}
              disabled={!day.hasCount || day.isLoading || day.save.isPending}
              className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold"
            >
              {day.save.isPending ? "Saving…" : "Save count as tomorrow's opening"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
