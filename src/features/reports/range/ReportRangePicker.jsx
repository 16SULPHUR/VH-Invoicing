import { CalendarRange } from "lucide-react";
import { RANGE_PRESETS } from "./reportRange";
import { useReportRange } from "./useReportRange";

export function ReportRangePicker() {
  const { preset, range, setPreset, setCustom } = useReportRange();

  return (
    <div className="-mx-4 flex max-w-[100vw] items-center gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      <CalendarRange className="mr-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {RANGE_PRESETS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={preset === value}
          onClick={() => setPreset(value)}
          className={`press h-8 shrink-0 rounded-full border-[1.5px] px-3 text-xs font-bold transition-colors ${
            preset === value ? "border-indigo bg-indigo text-white" : "border-border bg-surface hover:border-indigo/40"
          }`}
        >
          {label}
        </button>
      ))}
      {preset === "custom" && (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="date"
            aria-label="From"
            value={range.from}
            max={range.to || undefined}
            onChange={(event) => setCustom("from", event.target.value)}
            className="h-8 rounded-full border-[1.5px] border-border bg-surface px-3 text-xs font-semibold text-foreground"
          />
          to
          <input
            type="date"
            aria-label="To"
            value={range.to}
            min={range.from || undefined}
            onChange={(event) => setCustom("to", event.target.value)}
            className="h-8 rounded-full border-[1.5px] border-border bg-surface px-3 text-xs font-semibold text-foreground"
          />
        </span>
      )}
    </div>
  );
}
