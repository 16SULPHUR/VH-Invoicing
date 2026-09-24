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

export function StockAlerts({ analytics }) {
  const out = analytics?.outOfStockItems ?? 0;
  const low = analytics?.lowStockItems ?? 0;
  if (!out && !low) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2 rounded-2xl border border-marigold/50 bg-marigold/15 px-4 py-2.5 text-sm font-semibold text-foreground"
    >
      <AlertTriangle size={16} strokeWidth={ICON_STROKE} className="shrink-0 text-warning" aria-hidden />
      <span>
        {out > 0 && `${out} out of stock`}
        {out > 0 && low > 0 && ", "}
        {low > 0 && `${low} running low`}
      </span>
    </div>
  );
}
