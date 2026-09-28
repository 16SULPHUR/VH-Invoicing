import { Loader2, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatAmount } from "@/utils/formatters";
import { ICON_STROKE } from "@/config/navigation";

const HEADERS = ["Item", "Qty", "Price", ""];

export function ScannedItemsTable({ items, isLoading, isBusy, onRefresh, onClear, onDelete }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Scan list</h2>
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
            variant="destructive"
            size="sm"
            className="press"
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                {HEADERS.map((header, index) => (
                  <th
                    key={header || index}
                    scope="col"
                    className={`px-3 py-2 font-medium ${index > 0 ? "text-right" : ""}`}
                  >
                    {header || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.barcode} className="hover:bg-surface/60">
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-2 text-right tabular-nums">₹{formatAmount(item.price)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => onDelete(item.barcode)}
                      disabled={isBusy}
                      className="press rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-40"
                    >
                      <Trash2 size={15} strokeWidth={ICON_STROKE} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
