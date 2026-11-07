import { useMemo } from "react";
import { byPeriod, fillDays, totals } from "../lib/analytics";
import { iso } from "../range/reportRange";
import { useReportRange } from "../range/useReportRange";
import { useReportData } from "./useReportData";

const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86_400_000) + 1;

function monthsBetween(from, to) {
  const out = [];
  const cursor = new Date(`${from.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${to.slice(0, 7)}-01T00:00:00`);
  while (cursor <= end) {
    out.push(iso(cursor).slice(0, 7));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

/** The selected range's bills plus the previous period and last year, with a trend series lined up against the previous period. */
export function useRangeReport() {
  const data = useReportData();
  const rangeState = useReportRange();
  const { range, previous, lastYear } = rangeState;

  return useMemo(() => {
    const from = range.from || data.firstDay || iso(new Date());
    const to = range.to || iso(new Date());
    const effective = { from, to };
    const bills = data.pick(effective);
    const previousBills = previous ? data.pick(previous) : [];
    const lastYearBills = lastYear ? data.pick(lastYear) : [];

    const unit = daysBetween(from, to) <= 62 ? "day" : "month";
    let trend;
    if (unit === "day") {
      const now = fillDays(byPeriod(bills, "day"), from, to);
      const before = previous ? fillDays(byPeriod(previousBills, "day"), previous.from, previous.to) : [];
      trend = now.map((row, i) => ({ ...row, previous: before[i]?.sales ?? null, previousPeriod: before[i]?.period }));
    } else {
      const byMonth = new Map(byPeriod(bills, "month").map((r) => [r.period, r]));
      const beforeMonths = previous ? monthsBetween(previous.from, previous.to) : [];
      const beforeMap = new Map(byPeriod(previousBills, "month").map((r) => [r.period, r]));
      trend = monthsBetween(from, to).map((month, i) => ({
        period: month,
        sales: byMonth.get(month)?.sales ?? 0,
        bills: byMonth.get(month)?.bills ?? 0,
        previous: beforeMonths[i] ? beforeMap.get(beforeMonths[i])?.sales ?? 0 : null,
        previousPeriod: beforeMonths[i],
      }));
    }

    return {
      ...data,
      ...rangeState,
      effective,
      bills,
      now: totals(bills),
      before: previous ? totals(previousBills) : null,
      lastYearTotals: lastYear ? totals(lastYearBills) : null,
      unit,
      trend,
      days: fillDays(byPeriod(bills, "day"), from, to),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.all, data.index, range.from, range.to, previous?.from, previous?.to, lastYear?.from, lastYear?.to, rangeState.preset]);
}
