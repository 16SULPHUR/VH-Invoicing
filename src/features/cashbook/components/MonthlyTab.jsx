import { useMemo } from "react";
import { CalendarRange } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRupees } from "@/utils/formatters";
import { buildHistory, summarizeMonths } from "../history";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return MONTH_FORMAT.format(new Date(year, month - 1, 1));
}

function Line({ label, value, tone = "" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export function MonthlyTab({ cashbook }) {
  const months = useMemo(
    () =>
      summarizeMonths(
        buildHistory({
          accounts: cashbook.accounts,
          transactions: cashbook.transactions,
          reconciliations: cashbook.reconciliations,
        })
      ),
    [cashbook.accounts, cashbook.transactions, cashbook.reconciliations]
  );

  if (months.length === 0) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Nothing to total yet"
        description="Months appear once days are closed."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {months.map((month) => {
        const reasons = [...month.byReason.entries()];
        const people = [...month.people.entries()].sort((a, b) => b[1] - a[1]);
        return (
          <section key={month.key} className="rounded-2xl border border-border/70 bg-surface p-4">
            <h3 className="font-display text-lg font-bold">{monthLabel(month.key)}</h3>
            <div className="mt-2 divide-y divide-border">
              <Line label="Brought home" value={formatRupees(month.brought)} />
              {reasons.map(([label, total]) => (
                <Line
                  key={label}
                  label={label}
                  value={`−${formatRupees(total)}`}
                  tone="text-destructive"
                />
              ))}
              {people.map(([name, total]) => (
                <Line key={name} label={`  to ${name}`} value={formatRupees(total)} />
              ))}
              <Line
                label="Average left in shop"
                value={
                  month.shopLeftDays ? formatRupees(month.shopLeftTotal / month.shopLeftDays) : "-"
                }
              />
              <Line
                label="Drawer short / extra"
                value={`${month.difference > 0 ? "+" : month.difference < 0 ? "−" : ""}${formatRupees(Math.abs(month.difference))}`}
                tone={Math.abs(month.difference) >= 1 ? "text-warning" : "text-success"}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
