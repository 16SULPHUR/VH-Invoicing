import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useCustomers } from "@/features/customers/hooks/useCustomers";
import { phoneDigits } from "@/features/customers/lib/customerKey";
import { formatPhone } from "../lib/shopTools";

/** Name and phone, with matches from the customer directory to fill both in one tap. */
export function CustomerFields({ name, phone, onChange, idPrefix, required = true }) {
  const customers = useCustomers();
  const [focused, setFocused] = useState(null);
  const needle = (focused === "phone" ? phoneDigits(phone) : String(name ?? "").trim().toLowerCase()) || "";

  const matches = useMemo(() => {
    if (!focused || needle.length < 2) return [];
    return customers.data
      .filter((customer) =>
        focused === "phone"
          ? phoneDigits(customer.phone).includes(needle)
          : String(customer.name ?? "").toLowerCase().includes(needle)
      )
      .slice(0, 5);
  }, [customers.data, focused, needle]);

  const pick = (customer) => {
    onChange({ customer_name: customer.name ?? "", customer_phone: phoneDigits(customer.phone) });
    setFocused(null);
  };

  const list = (field) =>
    focused === field &&
    matches.length > 0 && (
      <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
        {matches.map((customer) => (
          <li key={customer.id}>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(customer)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
            >
              <span className="truncate font-semibold">{customer.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatPhone(customer.phone)}</span>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Customer name" htmlFor={`${idPrefix}-name`} required={required}>
        <div className="relative">
          <Input
            id={`${idPrefix}-name`}
            value={name ?? ""}
            autoComplete="off"
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            onChange={(event) => onChange({ customer_name: event.target.value })}
          />
          {list("name")}
        </div>
      </Field>
      <Field label="Phone" htmlFor={`${idPrefix}-phone`}>
        <div className="relative">
          <Input
            id={`${idPrefix}-phone`}
            value={phone ?? ""}
            inputMode="tel"
            autoComplete="off"
            onFocus={() => setFocused("phone")}
            onBlur={() => setFocused(null)}
            onChange={(event) => onChange({ customer_phone: event.target.value.replace(/[^\d+ ]/g, "") })}
          />
          {list("phone")}
        </div>
      </Field>
    </div>
  );
}
