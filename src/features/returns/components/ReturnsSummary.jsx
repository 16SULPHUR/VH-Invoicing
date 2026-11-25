import { useState } from "react";
import { ChevronRight, Undo2 } from "lucide-react";
import { formatRupees } from "@/utils/formatters";
import { ReturnsDialog } from "./ReturnsDialog";

/** One tappable line on a bill: how much came back and the net bill, opening the returns modal. */
export function ReturnsSummary({ invoice, notes, onChanged }) {
  const [open, setOpen] = useState(false);
  if (notes.length === 0) return null;
  const returned = notes.reduce((sum, note) => sum + Number(note.amount || 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex w-full items-center gap-3 rounded-2xl border border-border bg-marigold/10 px-3.5 py-3 text-left"
      >
        <Undo2 className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {notes.length} {notes.length === 1 ? "return" : "returns"} · {formatRupees(returned)}
          </span>
          <span className="block text-xs text-muted-foreground">Net bill {formatRupees(Number(invoice.total || 0) - returned)}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {open && <ReturnsDialog invoice={invoice} notes={notes} onClose={() => setOpen(false)} onChanged={onChanged} />}
    </>
  );
}
