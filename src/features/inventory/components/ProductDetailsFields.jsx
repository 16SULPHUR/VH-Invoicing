import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Extra product details (fabric, colour, size…) that stickers can print. Fields come from shop settings. */
export function ProductDetailsFields({ fields, value, onChange, available, idPrefix = "detail" }) {
  if (!available) {
    return (
      <p className="rounded-xl bg-marigold/15 px-3 py-2 text-xs text-warning">
        Fabric, colour, size and other details can be saved once docs/schema/sticker_designer.sql is run in Supabase.
      </p>
    );
  }
  const details = value ?? {};
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-muted-foreground">Details for stickers (optional)</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={`${idPrefix}-${key}`} className="text-[11px] font-semibold text-muted-foreground">
              {label}
            </Label>
            <Input
              id={`${idPrefix}-${key}`}
              value={details[key] ?? ""}
              onChange={(event) => onChange({ ...details, [key]: event.target.value })}
              className="h-9"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
