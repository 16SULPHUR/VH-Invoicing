import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { daysUntil, dueLabel, shortDate } from "../lib/shopTools";

export function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 py-2 text-[15px] placeholder:text-muted-foreground focus-visible:border-rani/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20 focus-visible:ring-offset-0",
        className
      )}
      rows={2}
      {...props}
    />
  );
}

export function MoneyInput({ value, onChange, id, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(event) => onChange(Math.max(0, Math.round(Number(event.target.value) || 0)))}
        className="pl-7 text-right tabular-nums"
        {...props}
      />
    </div>
  );
}

export function TokenPill({ token, className = "" }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-lg bg-indigo px-2 py-1 font-display text-sm font-extrabold leading-none text-white", className)}>
      {token}
    </span>
  );
}

/** Date with "3 days late" in red once it has passed; `done` turns the warning off. */
export function DueText({ date, done = false, prefix = "" }) {
  const days = daysUntil(date);
  const late = !done && days !== null && days < 0;
  const soon = !done && days !== null && days >= 0 && days <= 1;
  const label = dueLabel(date);
  const text =
    days === null || late
      ? label
      : days < 0
        ? `${prefix}${shortDate(date)}`
        : `${prefix}${prefix && /^(Today|Tomorrow|In )/.test(label) ? label[0].toLowerCase() + label.slice(1) : label}`;
  return (
    <span className={cn("tabular-nums", late ? "font-bold text-destructive" : soon ? "font-semibold text-warning" : "text-muted-foreground")}>
      {text}
    </span>
  );
}

const TONES = {
  neutral: "bg-secondary text-muted-foreground",
  indigo: "bg-indigo/10 text-indigo",
  marigold: "bg-marigold/20 text-warning",
  leaf: "bg-leaf/10 text-leaf",
  rani: "bg-accent text-accent-foreground",
  red: "bg-destructive/10 text-destructive",
};

const SOLID = {
  neutral: "bg-white/90 text-indigo",
  indigo: "bg-white text-indigo",
  marigold: "bg-marigold text-marigold-foreground",
  leaf: "bg-leaf text-white",
  rani: "bg-rani text-white",
  red: "bg-destructive text-white",
};

/** `solid` is for dark headers. */
export function StatusPill({ tone = "neutral", solid = false, children }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", (solid ? SOLID : TONES)[tone])}>
      {children}
    </span>
  );
}

/** Search box and the tab's main "new" button. */
export function ListToolbar({ search, onSearch, placeholder, onNew, newLabel, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 basis-56 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} className="pl-9" type="search" />
      </div>
      {children}
      {onNew && (
        <Button variant="rani" className="press ml-auto h-10" onClick={onNew}>
          <Plus className="h-4 w-4" aria-hidden /> {newLabel}
        </Button>
      )}
    </div>
  );
}

/** A tappable list row: token, who, what, when and money. */
export function RecordRow({ token, title, subtitle, due, pill, amount, amountLabel, late, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "press flex w-full items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-3 text-left shadow-[0_1px_0_hsl(var(--border))] transition-shadow hover:ring-2 hover:ring-marigold",
          late && "ring-1 ring-destructive/40 bg-destructive/[0.04]"
        )}
      >
        <TokenPill token={token} className="min-w-[3.25rem] justify-center py-2" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold">{title}</span>
            {pill}
          </div>
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
          {due && <div className="text-xs">{due}</div>}
        </div>
        {amount !== undefined && (
          <div className="shrink-0 text-right">
            <div className="font-display text-base font-extrabold tabular-nums">{amount}</div>
            {amountLabel && <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{amountLabel}</div>}
          </div>
        )}
      </button>
    </li>
  );
}

export function StatStrip({ items }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(({ label, value, tone }) => (
        <div key={label} className="rounded-2xl border border-border/70 bg-surface px-3 py-2.5">
          <p className="eyebrow truncate text-[10px]">{label}</p>
          <p className={cn("mt-1 font-display text-xl font-bold tabular-nums leading-none sm:text-2xl", tone)}>{value}</p>
        </div>
      ))}
    </div>
  );
}
