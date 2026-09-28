import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const selectClass = "h-9 rounded-xl border-[1.5px] border-input bg-surface px-2 text-sm focus-visible:border-rani";

/** Day and month only; stored as a 2000 date because the year doesn't matter. */
function DayMonthField({ id, label, value, onChange }) {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(value ?? "");
  const month = match ? Number(match[1]) : "";
  const day = match ? Number(match[2]) : "";
  const update = (nextDay, nextMonth) =>
    onChange(nextDay && nextMonth ? `2000-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}` : null);
  const daysIn = month ? new Date(2000, month, 0).getDate() : 31;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${id}-day`} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-1.5">
        <select
          id={`${id}-day`}
          aria-label={`${label} day`}
          value={day}
          onChange={(event) => update(Number(event.target.value), month || 1)}
          className={`${selectClass} w-[4.5rem]`}
        >
          <option value="">Day</option>
          {Array.from({ length: daysIn }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {index + 1}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} month`}
          value={month}
          onChange={(event) => update(Math.min(day || 1, new Date(2000, Number(event.target.value), 0).getDate()), Number(event.target.value))}
          className={`${selectClass} flex-1`}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Offers consent plus birthday and anniversary, for the add and edit customer forms. */
export function WhatsAppFields({ idPrefix, customer, onChange }) {
  const setOptin = (allow) => {
    const stamp = new Date().toISOString();
    onChange("wa_optin", allow);
    if (allow) {
      onChange("wa_optin_at", stamp);
      onChange("wa_optout_at", null);
    } else if (customer?.wa_optin) {
      onChange("wa_optout_at", stamp);
    }
  };

  return (
    <div className="grid gap-3 rounded-2xl bg-surface-elevated p-3">
      <label className="flex items-center justify-between gap-3">
        <span>
          <span className="block text-sm font-semibold">Offers on WhatsApp</span>
          <span className="block text-xs text-muted-foreground">Said yes to new arrivals and festival offers.</span>
        </span>
        <Switch id={`${idPrefix}-optin`} checked={Boolean(customer?.wa_optin)} onCheckedChange={setOptin} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <DayMonthField id={`${idPrefix}-birthday`} label="Birthday" value={customer?.birthday} onChange={(value) => onChange("birthday", value)} />
        <DayMonthField
          id={`${idPrefix}-anniversary`}
          label="Anniversary"
          value={customer?.anniversary}
          onChange={(value) => onChange("anniversary", value)}
        />
      </div>
    </div>
  );
}
