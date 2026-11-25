import { StatusPill } from "@/features/counter/components/Bits";
import { STATUS_LABEL } from "../lib/billMath";

const TONE = { paid: "leaf", overdue: "red", partial: "marigold", unpaid: "indigo" };

export function StatusChip({ status }) {
  return <StatusPill tone={TONE[status]}>{STATUS_LABEL[status]}</StatusPill>;
}

export function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`press h-8 shrink-0 rounded-full border-[1.5px] px-3 text-xs font-bold transition-colors ${active ? "border-indigo bg-indigo text-white" : "border-border bg-surface hover:border-indigo/40"}`}
    >
      {children}
    </button>
  );
}
