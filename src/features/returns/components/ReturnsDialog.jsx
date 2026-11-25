import { useState } from "react";
import { Pencil, Printer, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatRupees } from "@/utils/formatters";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { TokenPill } from "@/features/counter/components/Bits";
import { usePrintSlip } from "@/features/counter/hooks/usePrintSlip";
import { creditNoteSlip, longDateYear } from "@/features/counter/lib/slips";
import { useCancelReturn } from "../hooks/useBillReturns";
import { refundParts } from "../lib/returnMath";
import { EditReturnSheet } from "./EditReturnSheet";

const REFUND_LABELS = [
  ["cash", "Cash"],
  ["upi", "UPI"],
  ["due", "Off the due"],
  ["credit", "Store credit"],
];

function ReturnCard({ note, invoice, onEdit, onDelete }) {
  const printSlip = usePrintSlip();
  const parts = refundParts(note);
  const used = Number(note.redeemed || 0);

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <TokenPill token={note.token} />
          <p className="text-xs text-muted-foreground">{formatDateDDMMMYYYY(note.created_at)}</p>
        </div>
        <p className="font-display text-2xl font-extrabold tabular-nums">{formatRupees(note.amount)}</p>
      </header>

      <ul className="divide-y divide-border text-sm">
        {(note.lines ?? []).map((line) => (
          <li key={line.key ?? `${line.bill_line}-${line.name}`} className="flex justify-between gap-3 py-1.5">
            <span className="min-w-0 truncate">
              {line.name} <span className="text-muted-foreground">×{line.quantity}</span>
              {line.restock === false && <span className="ml-1.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">not restocked</span>}
            </span>
            <span className="shrink-0 tabular-nums">{formatRupees(Number(line.price) * Number(line.quantity))}</span>
          </li>
        ))}
      </ul>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {REFUND_LABELS.filter(([key]) => parts[key] > 0).map(([key, label]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-semibold tabular-nums">{formatRupees(parts[key])}</dd>
          </div>
        ))}
        {used > 0 && (
          <div className="contents">
            <dt className="text-muted-foreground">Store credit used</dt>
            <dd className="text-right font-semibold tabular-nums">{formatRupees(used)}</dd>
          </div>
        )}
      </dl>

      {parts.credit > 0 && (
        <p className="rounded-xl bg-accent px-3 py-2 text-xs">
          Store credit balance <b>{formatRupees(parts.credit)}</b> · {note.expires_on ? `valid till ${longDateYear(note.expires_on)}` : "no expiry"}
        </p>
      )}
      {note.note && <p className="rounded-xl bg-surface-elevated px-3 py-2 text-sm">{note.note}</p>}

      <footer className="mt-auto flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" className="press" onClick={() => printSlip(creditNoteSlip(note, invoice))}>
          <Printer className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Print
        </Button>
        <Button type="button" variant="outline" size="sm" className="press" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Edit
        </Button>
        <Button type="button" variant="ghost" size="sm" className="press text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Delete
        </Button>
      </footer>
    </article>
  );
}

/** Every return made on a bill, side by side, with print, edit and delete. */
export function ReturnsDialog({ invoice, notes, onClose, onChanged }) {
  const { toast } = useToast();
  const cancel = useCancelReturn(invoice);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const returned = notes.reduce((sum, note) => sum + Number(note.amount || 0), 0);
  const editingNote = editing ? notes.find((note) => note.id === editing) ?? null : null;

  const confirmDelete = async () => {
    const note = deleting;
    setDeleting(null);
    try {
      await cancel.mutateAsync(note);
      toast({ title: `${note.token} deleted`, description: "Stock and the bill's due are back as before the return." });
      onChanged?.(invoice.date);
      if (notes.length <= 1) onClose();
    } catch {
      // the mutation already told the user
    }
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Returns on bill #{invoice.id}</DialogTitle>
            <DialogDescription>
              {invoice.customerName || "Walk-in"} · {formatDateDDMMMYYYY(invoice.date)} · returned {formatRupees(returned)} of {formatRupees(invoice.total)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            {notes.map((note) => (
              <ReturnCard key={note.id} note={note} invoice={invoice} onEdit={() => setEditing(note.id)} onDelete={() => setDeleting(note)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <EditReturnSheet
        open={Boolean(editingNote)}
        note={editingNote}
        invoice={invoice}
        onClose={() => setEditing(null)}
        onSaved={() => onChanged?.(invoice.date)}
      />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.token}?</AlertDialogTitle>
            <AlertDialogDescription>
              The {formatRupees(deleting?.amount)} return is cancelled: restocked pieces come back out of stock, any due it took off the bill goes back on, and it leaves the sales
              and books. The refunded money is treated as not paid out. The credit note number stays in the GST series as cancelled.
              {Number(deleting?.redeemed) > 0 && " Store credit from this note was already used, so it cannot be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={Number(deleting?.redeemed) > 0}
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
