import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-8 w-full min-w-0 rounded-lg border-[1.5px] border-border bg-surface-elevated px-2 text-[13px] tabular-nums transition-colors focus-visible:border-rani/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20 focus-visible:ring-offset-0 disabled:opacity-50";

export function FieldLabel({ htmlFor, children, className }) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-[11px] font-bold text-muted-foreground", className)}>
      {children}
    </label>
  );
}

const trimNumber = (value) => (Number.isFinite(Number(value)) ? String(Math.round(Number(value) * 1000) / 1000) : "");

/** A number input that allows half-typed values ("12.") and steps with the arrow keys (Shift ×10). */
export function NumberField({ label, value, onChange, step = 0.1, min, max, suffix, disabled, className, title }) {
  const id = useId();
  const [text, setText] = useState(trimNumber(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(trimNumber(value));
  }, [value, focused]);

  const clamp = (number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, number));
  const emit = (number) => {
    const next = clamp(Math.round(number * 1000) / 1000);
    setText(trimNumber(next));
    onChange(next);
  };

  return (
    <div className={cn("min-w-0", className)} title={title}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <div className="relative mt-0.5">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(trimNumber(value));
          }}
          onChange={(event) => {
            setText(event.target.value);
            const number = Number(event.target.value.replace(",", "."));
            if (event.target.value.trim() !== "" && Number.isFinite(number)) onChange(clamp(number));
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            const delta = (event.key === "ArrowUp" ? 1 : -1) * step * (event.shiftKey ? 10 : 1);
            emit((Number(value) || 0) + delta);
          }}
          className={cn(inputClass, suffix && "pr-7")}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({ label, value, onChange, placeholder, multiline, className, mono, hint, error, ...rest }) {
  const id = useId();
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={cn("min-w-0", className)}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <Tag
        id={id}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={multiline ? 2 : undefined}
        spellCheck={false}
        className={cn(inputClass, "mt-0.5", multiline && "h-auto min-h-[3.5rem] resize-y py-1.5 leading-snug", mono && "font-mono text-[12px]", error && "border-destructive/60")}
        {...rest}
      />
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, className }) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <select id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={cn(inputClass, "mt-0.5 pr-1")}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** A small segmented control; options may carry an icon and an aria label. */
export function Segmented({ value, options, onChange, label, className }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && <span className="block text-[11px] font-bold text-muted-foreground">{label}</span>}
      <div role="radiogroup" aria-label={label} className="mt-0.5 flex h-8 rounded-lg border-[1.5px] border-border bg-surface-elevated p-0.5">
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={option.ariaLabel ?? option.label}
              title={option.ariaLabel ?? option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center rounded-md px-1.5 text-[12px] font-bold transition-colors",
                active ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden /> : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Section({ title, action, children, className }) {
  return (
    <section className={cn("space-y-2.5 border-b border-border/70 px-4 py-3.5 last:border-b-0", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-2">
          {title && <h3 className="eyebrow font-sans">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function IconButton({ label, onClick, disabled, active, children, className, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "press grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:h-4 [&_svg]:w-4",
        active && "bg-indigo/10 text-indigo",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
