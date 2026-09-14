import { Label } from "@/components/ui/label";

let fieldSeq = 0;

/**
 * Label above input, helper below, error below that. No placeholder-as-label.
 */
export function Field({ label, htmlFor, hint, error, required, children, className = "" }) {
  const id = htmlFor ?? `field-${(fieldSeq += 1)}`;

  return (
    <div className={`grid gap-2 ${className}`}>
      <Label
        htmlFor={id}
        className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {typeof children === "function" ? children(id) : children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
