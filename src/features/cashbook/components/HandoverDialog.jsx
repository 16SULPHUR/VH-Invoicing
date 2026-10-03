import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/common/Field";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { useHandover } from "../hooks/useHandover";
import { EnteredByField } from "./EnteredByField";

function Row({ label, hint, value, strong }) {
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

function AmountInput({ id, value, onChange, autoFocus }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      min="0"
      step="1"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-14 text-right font-display text-2xl font-extrabold tabular-nums"
      autoFocus={autoFocus}
    />
  );
}

export function HandoverDialog({ open, onOpenChange, cashbook }) {
  const day = useHandover({ ...cashbook, enabled: open });
  const settled = Math.abs(day.difference) < 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto bg-surface text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Evening handover · {formatDateDDMMMYYYY(day.today)}</DialogTitle>
        </DialogHeader>

        {!day.hasAccounts ? (
          <p className="text-sm text-muted-foreground">
            The cashbook needs HOME and SHOP accounts.
          </p>
        ) : day.error ? (
          <p className="text-sm text-destructive">
            Could not load today&apos;s takings: {day.error.message}
          </p>
        ) : (
          <div className="space-y-4">
            {day.closedToday && (
              <p className="rounded-xl bg-marigold/15 px-3.5 py-2.5 text-sm font-semibold text-warning">
                Already closed{day.closedToday.author ? ` by ${day.closedToday.author}` : ""}.
                Saving replaces that close.
              </p>
            )}

            <div className="divide-y divide-border rounded-2xl bg-surface-elevated px-4 py-2 text-sm">
              <Row
                label="Shop opening"
                hint="Last count plus today's cashbook entries"
                value={formatRupees(day.shopOpening)}
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

            <Field label="1. Cash counted in the drawer" htmlFor="handover-counted">
              {(id) => (
                <AmountInput id={id} value={day.counted} onChange={day.setCounted} autoFocus />
              )}
            </Field>

            {day.hasCount && (
              <p
                className={`rounded-xl px-3.5 py-2.5 text-sm font-bold ${
                  settled ? "bg-success/10 text-success" : "bg-marigold/15 text-warning"
                }`}
              >
                {settled
                  ? "Drawer matches today's sales."
                  : `${formatRupees(Math.abs(day.difference))} ${day.difference > 0 ? "extra" : "short"} against sales.`}
              </p>
            )}

            <Field label="2. Cash taken home" htmlFor="handover-taken">
              {(id) => <AmountInput id={id} value={day.taken} onChange={day.setTaken} />}
            </Field>

            {day.hasCount && (
              <div className="divide-y divide-border rounded-2xl bg-surface-elevated px-4 py-2 text-sm">
                <Row label="Home before" value={formatRupees(day.homeBefore)} />
                <Row label="Home after" value={formatRupees(day.homeAfter)} strong />
                <Row
                  label="Left in shop"
                  hint="Tomorrow's opening"
                  value={formatRupees(day.shopLeft)}
                  strong
                />
              </div>
            )}

            <EnteredByField value={day.by} onChange={day.setBy} />

            {day.problem && (
              <p role="alert" className="text-sm font-semibold text-destructive">
                {day.problem}
              </p>
            )}
            {day.armed && (
              <p role="alert" className="text-sm font-semibold text-warning">
                The drawer is off by {formatRupees(Math.abs(day.difference))}. Tap again to save
                anyway.
              </p>
            )}

            <Button
              onClick={() => day.submit(() => onOpenChange(false))}
              disabled={!day.canSave}
              className="block-shadow h-12 w-full rounded-2xl font-display text-base font-extrabold"
            >
              {day.isSaving ? "Saving…" : day.armed ? "Save anyway" : "Save handover"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
