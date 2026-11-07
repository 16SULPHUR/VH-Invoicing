import { FilePlus2 } from "lucide-react";
import { ICON_STROKE } from "@/config/navigation";

/** Drops whatever is on the till (a half-made bill or an edit) and starts a fresh bill. */
export function NewBillButton({ draft, onNewBill, onDark = false }) {
  const hasWork = draft.isEditing || draft.lines.length > 0;

  const handleClick = () => {
    if (hasWork && !window.confirm("Discard this bill and start a new one?")) return;
    onNewBill();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`press inline-flex h-9 items-center justify-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] font-bold ${
        onDark ? "border-white/25 text-white hover:bg-white/10" : "border-border bg-surface hover:border-input"
      }`}
    >
      <FilePlus2 size={16} strokeWidth={ICON_STROKE} aria-hidden />
      New bill
    </button>
  );
}
