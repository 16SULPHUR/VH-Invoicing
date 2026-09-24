import { Button } from "@/components/ui/button";
import { Field } from "@/components/common/Field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatTile } from "@/components/common/StatTile";
import { formatRupees } from "@/utils/formatters";
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
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id={id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALES_PERIODS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="motif-overlay rounded-2xl bg-rani px-4 py-3.5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-80">Total sales</p>
        <p className="mt-1.5 font-display text-3xl font-extrabold tabular-nums leading-none tracking-tight">
          {formatRupees(summary.total)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map(({ key, label, text }) => (
          <StatTile
            key={key}
            label={label}
            value={formatRupees(summary[key])}
            accent={`${text} text-xl`}
          />
        ))}
      </div>
    </section>
  );
}
