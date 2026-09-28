import { AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/common/StatTile";
import { ICON_STROKE } from "@/config/navigation";

const TILES = [
  { label: "Unique products", value: (a) => a.totalUniqueProducts.toLocaleString() },
  { label: "Items in stock", value: (a) => a.totalItemsInStock.toLocaleString() },
  { label: "Stock value", value: (a) => `₹${a.totalInventoryValue.toLocaleString()}` },
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
      className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
      <AlertTriangle size={16} strokeWidth={ICON_STROKE} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        {out > 0 && `${out} out of stock`}
        {out > 0 && low > 0 && ", "}
        {low > 0 && `${low} running low`}
      </span>
    </div>
  );
}
