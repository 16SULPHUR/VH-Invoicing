import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "@/components/common/EmptyState";
import { TrendingUp } from "lucide-react";
import { formatAmount } from "@/utils/formatters";

/*
  One series over seven discrete days. Days are buckets, not a continuum, so bars
  are the honest form - an area fill would imply sales flowing between days. A
  single series needs no legend: the heading names it. Colour is validated
  against the dark surface (lightness band, chroma floor, 3:1 contrast).
*/
const CHART_CONFIG = {
  total: { label: "Sales", color: "hsl(var(--chart-1))" },
};

function compactINR(value) {
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `₹${value}`;
}

export function DailySalesChart({ dailySales }) {
  if (!dailySales?.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No sales yet"
        description="The last seven days will chart here."
      />
    );
  }

  return (
    <figure className="space-y-2">
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Daily sales, last 7 days
      </figcaption>

      <ChartContainer config={CHART_CONFIG} className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dailySales} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            <XAxis
              dataKey="formattedDate"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={46}
              tickFormatter={compactINR}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* The same numbers as a table, so the chart is never the only way to read them. */}
      <table className="sr-only">
        <caption>Daily sales, last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {dailySales.map((day) => (
            <tr key={day.date}>
              <th scope="row">{day.date}</th>
              <td>₹{formatAmount(day.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
