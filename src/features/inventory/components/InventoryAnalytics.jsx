import { AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/common/StatTile";
import { ICON_STROKE } from "@/config/navigation";
import { formatRupees } from "@/utils/formatters";

const TILES = [
  { label: "Unique products", value: (a) => a.totalUniqueProducts.toLocaleString() },
  { label: "Items in stock", value: (a) => a.totalItemsInStock.toLocaleString() },
  { label: "Stock value", value: (a) => formatRupees(a.totalInventoryValue) },
];

export function InventoryAnalytics({ analytics }) {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {TILES.map(({ label, value }) => (
        <StatTile key={label} label={label} value={value(analytics)} />
      ))}
    </div>
  );
}

const LEVELS = [
  { key: "out", count: (a) => a.outOfStockItems, label: "out of stock", on: "border-destructive bg-destructive text-white" },
  { key: "low", count: (a) => a.lowStockItems, label: "running low", on: "border-marigold bg-marigold text-marigold-foreground" },
];

/** Tapping a count shows just those products; tapping it again shows everything. */
export function StockAlerts({ analytics, stockLevel, onChange }) {
  const levels = LEVELS.filter(({ count }) => (analytics ? count(analytics) : 0) > 0);
  if (levels.length === 0 && stockLevel === "all") return null;

  return (
    <div
      role="group"
      aria-label="Stock alerts"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-marigold/50 bg-marigold/15 px-3 py-2 text-sm font-semibold"
    >
      <AlertTriangle size={16} strokeWidth={ICON_STROKE} className="ml-1 shrink-0 text-warning" aria-hidden />
      {levels.map(({ key, count, label, on }) => (
        <button
          key={key}
          type="button"
          aria-pressed={stockLevel === key}
          onClick={() => onChange(stockLevel === key ? "all" : key)}
          className={`press rounded-full border-[1.5px] px-3 py-1 transition-colors ${
            stockLevel === key ? on : "border-marigold/60 bg-surface hover:border-marigold"
          }`}
        >
          <b className="tabular-nums">{count(analytics)}</b> {label}
        </button>
      ))}
      {stockLevel !== "all" && (
        <button
          type="button"
          onClick={() => onChange("all")}
          className="press ml-auto rounded-full px-3 py-1 text-rani hover:underline"
        >
          Show all products
        </button>
      )}
    </div>
  );
}
