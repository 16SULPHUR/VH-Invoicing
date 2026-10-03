import { useState } from "react";
import { PauseCircle, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ICON_STROKE } from "@/config/navigation";
import { formatRupees } from "@/utils/formatters";
import { invoiceItemCount, invoiceTotal } from "@/utils/invoice";
import { isBlankBill, useParkedBills } from "../hooks/useParkedBills";

const timeFormatter = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

/** Park the bill being written and bring one back, so a second customer never waits. */
export function ParkedBills({ draft }) {
  const { toast } = useToast();
  const { bills, park, take, discard } = useParkedBills();
  const [open, setOpen] = useState(false);

  const current = draft.snapshot();
  const canPark = !draft.isEditing && !isBlankBill(current);

  const parkCurrent = () => {
    park(current);
    draft.reset();
    toast({ title: "Bill parked", description: "Start the next customer. Resume it from Parked." });
  };

  const resume = (id) => {
    if (draft.isEditing) {
      toast({
        title: "Finish the edit first",
        description: "Save or cancel the bill you are editing, then resume.",
        variant: "destructive",
      });
      return;
    }
    if (canPark) park(current);
    const bill = take(id);
    if (bill) draft.restore(bill);
    setOpen(false);
  };

  if (!canPark && bills.length === 0) return null;

  return (
    <>
      <div className="flex gap-2">
        {canPark && (
          <Button type="button" variant="outline" className="press h-10 flex-1 font-bold" onClick={parkCurrent}>
            <PauseCircle size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
            Park bill
          </Button>
        )}
        {bills.length > 0 && (
          <Button
            type="button"
            variant="outline"
            className="press h-10 flex-1 font-bold"
            onClick={() => setOpen(true)}
          >
            <Play size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
            Parked · {bills.length}
          </Button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] space-y-3 overflow-y-auto rounded-t-3xl p-4 pb-6">
          <div className="pr-14">
            <SheetTitle>Parked bills</SheetTitle>
            <SheetDescription>Kept on this device. Resuming swaps with the bill on screen.</SheetDescription>
          </div>
          <ul className="space-y-2">
            {bills.map((bill) => (
              <li key={bill.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{bill.customerName || "Walk-in"}</div>
                  <div className="text-xs tabular-nums text-muted-foreground">
                    {timeFormatter.format(new Date(bill.parkedAt))} · {invoiceItemCount(bill.lines)} pcs ·{" "}
                    {formatRupees(invoiceTotal(bill.lines))}
                  </div>
                </div>
                <Button size="sm" onClick={() => resume(bill.id)}>
                  Resume
                </Button>
                <button
                  type="button"
                  aria-label="Discard parked bill"
                  onClick={() => discard(bill.id)}
                  className="press rounded-lg p-2 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                >
                  <Trash2 size={16} strokeWidth={ICON_STROKE} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
