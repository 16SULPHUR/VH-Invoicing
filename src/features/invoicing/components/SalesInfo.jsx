import { Button } from "@/components/ui/button";
import { Field } from "@/components/common/Field";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/common/StatTile";
import { formatAmount } from "@/utils/formatters";
import { PAYMENT_METHODS } from "../paymentMethods";

const SALES_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom range" },
];

export function SalesInfo({ period, setPeriod, customRange, setCustomRange, summary, onFetch }) {
  const setRangeField = (field) => (event) =>
    setCustomRange((previous) => ({ ...previous, [field]: event.target.value }));

  return (
    <section className="space-y-3">
      <Field label="Period" htmlFor="sales-period">
        {(id) => (
          <select
            id={id}
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SALES_PERIODS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
      </Field>

      {period === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From" htmlFor="sales-start">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={customRange.start}
                onChange={setRangeField("start")}
                className="h-9"
              />
            )}
          </Field>
          <Field label="To" htmlFor="sales-end">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={customRange.end}
                onChange={setRangeField("end")}
                className="h-9"
              />
            )}
          </Field>
          <Button
            type="button"
            className="press sm:col-span-2"
            disabled={!customRange.start || !customRange.end}
            onClick={onFetch}
          >
            Fetch range
          </Button>
        </div>
      )}

      <StatTile label="Total sales" value={`₹${formatAmount(summary.total)}`} />

      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map(({ key, label, text }) => (
          <StatTile
            key={key}
            label={label}
            value={`₹${formatAmount(summary[key])}`}
            accent={`${text} text-lg`}
          />
        ))}
      </div>
    </section>
  );
}
