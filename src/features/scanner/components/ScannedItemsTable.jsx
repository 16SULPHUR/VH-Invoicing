import { Loader2, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { swatchFor } from "@/utils/swatch";
import { ICON_STROKE } from "@/config/navigation";

export function ScannedItemsTable({ items, isLoading, isBusy, onRefresh, onClear, onDelete }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">
          Scanned{items.length > 0 && ` · ${items.length}`}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="press"
            onClick={onRefresh}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="press font-bold text-rani hover:bg-accent hover:text-rani"
            onClick={onClear}
            disabled={isBusy || items.length === 0}
          >
            Clear all
          </Button>
        </div>
      </div>

      {items.length === 0 && !isLoading ? (
        <EmptyState
          icon={ScanLine}
          title="Nothing scanned yet"
          description="Scanned items appear here and sync to the till."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.barcode}
              className="grid grid-cols-[2.25rem_1fr_auto_auto] items-center gap-3 rounded-2xl bg-surface py-2 pl-2 pr-2 shadow-[0_1px_0_hsl(var(--border))]"
            >
              <span
                className="swatch h-9 w-9 rounded-[0.6rem]"
                style={{ backgroundColor: swatchFor(item.name) }}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{item.name}</div>
                <div className="text-xs tabular-nums text-muted-foreground">
                  {item.barcode} · Qty {item.quantity}
                </div>
              </div>
              <span className="font-display font-bold tabular-nums">{formatRupees(item.price)}</span>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={() => onDelete(item.barcode)}
                disabled={isBusy}
                className="press rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
              >
                <Trash2 size={15} strokeWidth={ICON_STROKE} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
