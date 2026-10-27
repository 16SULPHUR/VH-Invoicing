import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Saves when the field loses focus or on Enter. */
export function CommitInput({ id, value, onCommit, ...props }) {
  return (
    <Input
      id={id}
      key={String(value)}
      defaultValue={value}
      onBlur={(event) => event.target.value !== String(value) && onCommit(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      {...props}
    />
  );
}

export function Section({ title, description, children, aside, className = "" }) {
  return (
    <section className={`space-y-3 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))] ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">
      {children}
    </Label>
  );
}

/** A grid of text values kept in shop settings. A field may add `error(draft)` and `normalize(value)`. */
export function ValueFields({ fields, settings, save, idPrefix = "shop" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(({ key, label, hint, placeholder, type, normalize = (value) => value.trim(), error, className = "" }) => {
        const message = error?.(settings[key]);
        return (
          <div key={key} className={`space-y-1.5 ${className}`}>
            <FieldLabel htmlFor={`${idPrefix}-${key}`}>{label}</FieldLabel>
            <CommitInput
              id={`${idPrefix}-${key}`}
              type={type}
              value={settings[key] ?? ""}
              placeholder={placeholder}
              onCommit={(value) => save({ [key]: normalize(value) })}
            />
            {message ? <p className="text-[11px] text-destructive">{message}</p> : hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function StoredBadge({ stored }) {
  if (stored === "cloud") return <span className="whitespace-nowrap text-[11px] font-bold text-success">Saved for every device</span>;
  if (stored === "device") return <span className="whitespace-nowrap text-[11px] font-bold text-warning">This device only</span>;
  if (stored === "offline") return <span className="whitespace-nowrap text-[11px] font-bold text-warning">Offline, saved here for now</span>;
  return null;
}

export function DeviceBadge() {
  return <span className="whitespace-nowrap text-[11px] font-bold text-muted-foreground">This device only</span>;
}
