import { useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ICON_STROKE } from "@/config/navigation";
import { ReturnSheet } from "./ReturnSheet";

/** The Return button for a bill, with its sheet. Needs the bill to be saved (not queued offline). */
export function ReturnAction({ invoice, notes, onReturned, className = "", variant = "outline" }) {
  const [open, setOpen] = useState(false);
  const queued = Boolean(invoice._syncStatus) && invoice._syncStatus !== "synced";

  return (
    <>
      <Button variant={variant} className={`press ${className}`} disabled={queued} onClick={() => setOpen(true)} title={queued ? "Wait for this bill to sync first" : undefined}>
        <Undo2 size={16} strokeWidth={ICON_STROKE} className="mr-2" aria-hidden />
        Return goods
      </Button>
      {open && <ReturnSheet open invoice={invoice} notes={notes} onClose={() => setOpen(false)} onReturned={onReturned} />}
    </>
  );
}
