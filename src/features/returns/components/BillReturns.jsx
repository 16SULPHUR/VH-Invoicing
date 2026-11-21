import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupees } from "@/utils/formatters";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { usePrintSlip } from "@/features/counter/hooks/usePrintSlip";
import { creditNoteSlip } from "@/features/counter/lib/slips";
import { refundParts } from "../lib/returnMath";

const REFUND_LABELS = [
  ["cash", "cash"],
  ["upi", "UPI"],
  ["due", "off the due"],
  ["credit", "store credit"],
];

/** Returns made on a bill, with what was refunded and a reprint of each credit note. */
export function BillReturns({ notes, total }) {
  const printSlip = usePrintSlip();
  if (notes.length === 0) return null;
  const returned = notes.reduce((sum, note) => sum + Number(note.amount || 0), 0);

  return (
    <section className="space-y-2 rounded-2xl border border-border bg-marigold/10 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="eyebrow">Returned</p>
        <p className="text-sm tabular-nums">
          <b>{formatRupees(returned)}</b> <span className="text-muted-foreground">· net {formatRupees(Number(total || 0) - returned)}</span>
        </p>
      </div>
      <ul className="divide-y divide-border/70">
        {notes.map((note) => {
          const parts = refundParts(note);
          return (
            <li key={note.id} className="flex items-start justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">
                  {note.token} <span className="font-normal text-muted-foreground">· {formatDateDDMMMYYYY(note.created_at)}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{(note.lines ?? []).map((line) => `${line.name} ×${line.quantity}`).join(", ")}</p>
                <p className="text-xs tabular-nums">
                  {REFUND_LABELS.filter(([key]) => parts[key] > 0)
                    .map(([key, label]) => `${formatRupees(parts[key])} ${label}`)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="font-bold tabular-nums">{formatRupees(note.amount)}</span>
                <Button type="button" variant="ghost" size="icon" className="press h-8 w-8" onClick={() => printSlip(creditNoteSlip(note))} aria-label={`Print ${note.token}`}>
                  <Printer className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
