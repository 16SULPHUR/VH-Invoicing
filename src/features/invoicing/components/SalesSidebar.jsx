import { DailySalesChart } from "./DailySalesChart";
import { SalesInfo } from "./SalesInfo";
import { formatAmount } from "@/utils/formatters";

const COLLECTION_TILES = [
  {
    key: "cash",
    label: "Cash (Today)",
    tile: "bg-green-800/50 border-green-700",
    text: "text-green-300",
  },
  {
    key: "upi",
    label: "UPI (Today)",
    tile: "bg-pink-800/50 border-pink-700",
    text: "text-pink-300",
  },
  {
    key: "credit",
    label: "Credit (Today)",
    tile: "bg-yellow-800/50 border-yellow-700",
    text: "text-yellow-300",
  },
];

export function SalesSidebar({ dailySales, sales }) {
  return (
    <div className="h-[90vh] w-full overflow-y-auto rounded-md px-2 pt-3 text-gray-100">
      <DailySalesChart dailySales={dailySales} />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {COLLECTION_TILES.map(({ key, label, tile, text }) => (
          <div key={key} className={`rounded border p-2 ${tile}`}>
            <div className={`text-xs ${text}`}>{label}</div>
            <div className="text-lg font-semibold">
              ₹{formatAmount(sales.todayCollections?.[key])}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <SalesInfo
          period={sales.period}
          setPeriod={sales.setPeriod}
          customRange={sales.customRange}
          setCustomRange={sales.setCustomRange}
          summary={sales.summary}
          onFetch={sales.refetchSummary}
        />
      </div>
    </div>
  );
}
