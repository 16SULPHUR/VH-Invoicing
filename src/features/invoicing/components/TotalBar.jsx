import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatRupees } from "@/utils/formatters";
import { CheckoutPanel } from "./CheckoutPanel";

/** Pink running total pinned above the tab bar; tapping it opens checkout. */
export function TotalBar({ draft, onSubmit, className = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`press motif-overlay flex items-center justify-between gap-3 rounded-3xl bg-rani py-3 pl-5 pr-3 text-left text-rani-foreground ${className}`}
        >
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-[0.08em] opacity-90">
              {draft.itemCount} {draft.itemCount === 1 ? "item" : "items"}
            </span>
            <span className="block font-display text-[28px] font-extrabold leading-none tracking-tight tabular-nums">
              {formatRupees(draft.total)}
            </span>
          </span>
          <span className="rounded-2xl bg-white px-4 py-2.5 font-display text-[15px] font-extrabold text-indigo">
            {draft.isEditing ? "Update bill" : "Checkout"}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Checkout</SheetTitle>
        </SheetHeader>
        <CheckoutPanel
          draft={draft}
          onSubmit={() => {
            setOpen(false);
            onSubmit();
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
