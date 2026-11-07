import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compactRupees, dayLabel, hourLabel, monthLabel, rupees, WEEKDAYS, weekdayLabel } from "../lib/format";

function TrendTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const label = unit === "month" ? monthLabel : (d) => `${weekdayLabel(d).slice(0, 3)}, ${dayLabel(d)}`;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-bold">{label(row.period)}</p>
      <p className="mt-1 flex items-center gap-2">
        <span className="h-2 w-2 rounded-sm bg-rani" aria-hidden /> {rupees(row.sales)} · {row.bills} bills
      </p>
      {row.previous != null && (
        <p className="mt-0.5 flex items-center gap-2 text-muted-foreground">
          <span className="h-0.5 w-3 bg-indigo/50" aria-hidden /> {rupees(row.previous)} {row.previousPeriod ? `on ${unit === "month" ? monthLabel(row.previousPeriod) : dayLabel(row.previousPeriod)}` : ""}
        </p>
      )}
    </div>
  );
}

/** Sales per day or month as bars, with the previous period as a thin line behind them. */
export function TrendChart({ rows, unit = "day", height = 240 }) {
  const tick = (value) => (unit === "month" ? monthLabel(value) : dayLabel(value));
  return (
    <div style={{ height }} className="-ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="period" tickFormatter={tick} tickLine={false} axisLine={false} minTickGap={24} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tickFormatter={compactRupees} tickLine={false} axisLine={false} width={52} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip content={<TrendTooltip unit={unit} />} cursor={{ fill: "hsl(var(--rani) / 0.08)" }} />
          <Bar dataKey="sales" fill="hsl(var(--rani))" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Line dataKey="previous" type="monotone" stroke="hsl(var(--indigo) / 0.45)" strokeWidth={2} dot={false} strokeDasharray="4 3" isAnimationActive={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const LEVELS = ["bg-muted", "bg-rani/20", "bg-rani/40", "bg-rani/65", "bg-rani"];

function level(value, max) {
  if (!value || value <= 0 || !max) return 0;
  return Math.min(4, 1 + Math.floor((value / max) * 3.999));
}

/** One block per day, grouped into months like a printed calendar, deeper pink for bigger days. */
export function CalendarHeat({ days, onPick }) {
  const max = Math.max(0, ...days.map((d) => d.sales));
  const months = new Map();
  for (const day of days) {
    const key = day.period.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(day);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-x-5 gap-y-4">
        {[...months.entries()].map(([month, list]) => {
          const offset = new Date(`${list[0].period}T00:00:00`).getDay();
          return (
            <div key={month}>
              <p className="eyebrow mb-1.5">{monthLabel(month)}</p>
              <div className="grid grid-cols-7 gap-[3px]">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="text-center text-[9px] font-bold text-muted-foreground">{w[0]}</span>
                ))}
                {Array.from({ length: offset }, (_, i) => <span key={`pad-${i}`} />)}
                {list.map((day) => (
                  <button
                    key={day.period}
                    type="button"
                    onClick={onPick ? () => onPick(day) : undefined}
                    title={`${dayLabel(day.period)}: ${rupees(day.sales)} · ${day.bills} bills`}
                    aria-label={`${dayLabel(day.period)}: ${rupees(day.sales)}, ${day.bills} bills`}
                    className={`h-4 w-4 rounded-[4px] ring-rani/50 hover:ring-2 ${LEVELS[level(day.sales, max)]}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        Quiet
        {LEVELS.map((cls) => <span key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} aria-hidden />)}
        Busy
      </div>
    </div>
  );
}

const INDIGO_LEVELS = ["bg-muted/70", "bg-indigo/20", "bg-indigo/40", "bg-indigo/65", "bg-indigo"];

/** Weekday by hour of day: when the money comes in. */
export function HourHeat({ grid }) {
  const active = [];
  for (let h = 0; h < 24; h += 1) if (grid.some((row) => row[h].bills > 0)) active.push(h);
  if (active.length === 0) return <p className="text-sm text-muted-foreground">No bills yet.</p>;
  const hours = [];
  for (let h = active[0]; h <= active[active.length - 1]; h += 1) hours.push(h);
  const max = Math.max(...grid.flat().map((c) => c.sales));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="border-separate border-spacing-[3px]">
        <thead>
          <tr>
            <th />
            {hours.map((h) => (
              <th key={h} scope="col" className="text-[10px] font-bold text-muted-foreground">{hourLabel(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.map((w) => (
            <tr key={w}>
              <th scope="row" className="pr-1 text-left text-[11px] font-bold text-muted-foreground">{WEEKDAYS[w]}</th>
              {hours.map((h) => {
                const cell = grid[w][h];
                return (
                  <td key={h} title={`${WEEKDAYS[w]} ${hourLabel(h)}: ${rupees(cell.sales)} · ${cell.bills} bills`} className={`h-6 w-9 rounded-md ${INDIGO_LEVELS[level(cell.sales, max)]}`}>
                    <span className="sr-only">{`${rupees(cell.sales)}, ${cell.bills} bills`}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const METHODS = [
  { key: "cash", label: "Cash", cls: "bg-cash" },
  { key: "upi", label: "UPI", cls: "bg-upi" },
  { key: "credit", label: "Credit", cls: "bg-credit" },
];

export function PaymentMix({ totals }) {
  const sum = METHODS.reduce((s, m) => s + Math.max(0, totals[m.key]), 0) || 1;
  return (
    <div>
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-full bg-muted">
        {METHODS.map((m) => (
          <span key={m.key} className={m.cls} style={{ width: `${(Math.max(0, totals[m.key]) / sum) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <div key={m.key}>
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-sm ${m.cls}`} aria-hidden />
              {m.label}
            </dt>
            <dd className="font-display text-lg font-bold tabular-nums">{rupees(totals[m.key])}</dd>
            <dd className="text-[11px] text-muted-foreground">{Math.round((Math.max(0, totals[m.key]) / sum) * 100)}%</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
