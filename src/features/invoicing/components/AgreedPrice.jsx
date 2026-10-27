import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupees, toNumber } from "@/utils/formatters";

/** For the common shop deal: customer and shopkeeper settle on one price below the tag total. */
export function AgreedPrice({ draft }) {
  const [value, setValue] = useState("");
  const tagTotal = draft.lines.reduce(
    (sum, line) => sum + toNumber(line.mrp ?? line.price) * toNumber(line.quantity),
    0
  );
  const total = toNumber(draft.total);
  const saved = tagTotal - total;
  if (draft.lines.length === 0) return null;

  const apply = () => {
    const goal = toNumber(value);
    if (goal <= 0) return;
    draft.settleTotal(goal);
    setValue("");
  };

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface-elevated p-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-bold">Agreed price</span>
        {saved > 0.5 ? (
          <span className="text-xs font-bold text-success">
            {formatRupees(tagTotal)} tag · {formatRupees(saved)} off
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Tag total {formatRupees(tagTotal)}</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && apply()}
          placeholder="Settle whole bill at ₹"
          className="h-10 bg-surface tabular-nums"
        />
        <Button type="button" variant="outline" className="h-10" onClick={apply} disabled={!toNumber(value)}>
          Apply
        </Button>
      </div>
    </div>
  );
}
