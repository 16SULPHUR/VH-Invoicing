import { cn } from "@/lib/utils";

/** One-of filter chips, as used on the credit report. */
export function Chips({ value, options, onChange, label, className = "" }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "press inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1 text-xs font-bold transition-colors",
            value === option.value ? "border-indigo bg-indigo text-white" : "border-border bg-surface hover:border-indigo/40"
          )}
        >
          {option.label}
          {option.count > 0 && (
            <span
              className={cn(
                "rounded-full px-1.5 text-[10px] tabular-nums",
                value === option.value ? "bg-white/20" : option.alert ? "bg-destructive text-white" : "bg-secondary"
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
