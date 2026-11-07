import { DailySalesChart } from "./DailySalesChart";
import { SalesInfo } from "./SalesInfo";
import { StatTile } from "@/components/common/StatTile";
import { formatRupees } from "@/utils/formatters";
import { PAYMENT_METHODS } from "../paymentMethods";

export function SalesSidebar({ dailySales, sales }) {
  return (
    <div className="space-y-5 p-4">
      <DailySalesChart dailySales={dailySales} />

      <section className="space-y-2">
        <h3 className="font-display text-lg font-bold">Collected today</h3>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map(({ key, label, text }) => (
            <StatTile
              key={key}
              label={label}
              value={formatRupees(sales.todayCollections?.[key])}
              accent={`${text} text-xl`}
            />
          ))}
        </div>
      </section>

      <SalesInfo
        period={sales.period}
        setPeriod={sales.setPeriod}
        customRange={sales.customRange}
        setCustomRange={sales.setCustomRange}
        summary={sales.summary}
        onFetch={sales.refetchSummary}
      />
    </div>
  );
}
