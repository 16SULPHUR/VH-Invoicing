import { Minus, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatRupees } from "@/utils/formatters";
import { rupees } from "../lib/shopTools";

function Stepper({ value, onChange, min = 1, max = Infinity, label }) {
  return (
    <div className="flex items-center rounded-full border-[1.5px] border-border bg-surface">
      <button
        type="button"
        className="press grid h-8 w-8 place-items-center rounded-full hover:bg-secondary disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`One less ${label}`}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        type="button"
        className="press grid h-8 w-8 place-items-center rounded-full hover:bg-secondary disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`One more ${label}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

export { Stepper };

/** Pieces with editable price and quantity. Stock shows what the system has left. */
export function LineEditor({ lines, onChange, products, editableNames = false, emptyText = "No pieces yet." }) {
  const update = (key, changes) => onChange(lines.map((line) => (line.key === key ? { ...line, ...changes } : line)));
  const stockOf = (line) => products?.find((product) => String(product.id) === line.product_id)?.quantity;

  if (lines.length === 0) {
    return <p className="rounded-2xl border-2 border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {lines.map((line) => {
        const stock = line.product_id ? Number(stockOf(line) ?? 0) : null;
        return (
          <li key={line.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
            <div className="min-w-0 flex-1 basis-40">
              {editableNames && !line.product_id ? (
                <Input
                  value={line.name}
                  onChange={(event) => update(line.key, { name: event.target.value })}
                  placeholder="What is being made"
                  className="h-9"
                  aria-label="Item"
                />
              ) : (
                <>
                  <p className="truncate text-sm font-semibold">{line.name}</p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {line.barcode ?? "Custom"}
                    {stock !== null && (
                      <span className={stock < line.quantity ? "text-destructive" : ""}> · {stock} in stock</span>
                    )}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={line.price}
                  onChange={(event) => update(line.key, { price: rupees(event.target.value) })}
                  className="h-9 w-24 pl-6 text-right"
                  aria-label={`Price of ${line.name || "item"}`}
                />
              </label>
              <Stepper value={line.quantity} onChange={(quantity) => update(line.key, { quantity })} label={line.name || "item"} />
              <button
                type="button"
                onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                className="press grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${line.name || "item"}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </li>
        );
      })}
      <li className="flex items-center justify-between bg-surface-elevated px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {lines.reduce((sum, line) => sum + line.quantity, 0) === 1 ? "1 piece" : `${lines.reduce((sum, line) => sum + line.quantity, 0)} pieces`}
        </span>
        <span className="font-bold tabular-nums">
          {formatRupees(lines.reduce((sum, line) => sum + rupees(line.price) * line.quantity, 0))}
        </span>
      </li>
    </ul>
  );
}
