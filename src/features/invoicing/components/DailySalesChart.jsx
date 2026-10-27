import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { EmptyState } from "@/components/common/EmptyState";
import { TrendingUp } from "lucide-react";
import { formatRupees } from "@/utils/formatters";

const CHART_CONFIG = {
  total: { label: "Sales", color: "hsl(var(--rani))" },
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
      <figcaption className="font-display text-lg font-bold">
        Last 7 days
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
              cursor={{ fill: "hsl(var(--accent))" }}
            />
            <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} maxBarSize={28} />
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
              <td>{formatRupees(day.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
