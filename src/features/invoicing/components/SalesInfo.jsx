import { formatAmount } from "@/utils/formatters";

const SALES_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Date Range" },
];

const fieldClass =
  "w-full rounded-md border border-gray-600 bg-gray-700 p-2 text-white focus:border-pink-500 focus:outline-none";

export function SalesInfo({ period, setPeriod, customRange, setCustomRange, summary, onFetch }) {
  const setRangeField = (field) => (event) =>
    setCustomRange((previous) => ({ ...previous, [field]: event.target.value }));

  return (
    <div className="mb-5 rounded-md border border-gray-700 bg-gray-800 p-4 shadow-md">
      <label htmlFor="salesPeriod" className="mb-2 block font-semibold text-pink-500">
        Select Sales Period:
      </label>
      <select
        id="salesPeriod"
        className={fieldClass}
        value={period}
        onChange={(event) => setPeriod(event.target.value)}
      >
        {SALES_PERIODS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {period === "custom" && (
        <div className="mt-4">
          <label className="mb-1 block text-sm text-pink-500" htmlFor="salesStart">
            Start Date:
          </label>
          <input
            type="date"
            id="salesStart"
            className={fieldClass}
            value={customRange.start}
            onChange={setRangeField("start")}
          />
          <label className="mb-1 mt-4 block text-sm text-pink-500" htmlFor="salesEnd">
            End Date:
          </label>
          <input
            type="date"
            id="salesEnd"
            className={fieldClass}
            value={customRange.end}
            onChange={setRangeField("end")}
          />
          <button
            type="button"
            className="mt-4 w-full rounded-md bg-pink-600 py-2 text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
            disabled={!customRange.start || !customRange.end}
            onClick={onFetch}
          >
            Fetch Custom Sales
          </button>
        </div>
      )}

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-pink-500">Total Sales:</h4>
        <p className="mt-2 text-3xl text-white">₹ {formatAmount(summary.total)}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <span className="rounded-md bg-green-700 px-2 py-1 text-lg font-semibold text-white">
          💸 ₹{formatAmount(summary.cash)}
        </span>
        <span className="rounded-md bg-pink-700 px-2 py-1 text-lg font-semibold text-white">
          🏛️ ₹{formatAmount(summary.upi)}
        </span>
        <span className="rounded-md bg-red-700 px-2 py-1 text-lg font-semibold text-white">
          ❌ ₹{formatAmount(summary.credit)}
        </span>
      </div>
    </div>
  );
}
