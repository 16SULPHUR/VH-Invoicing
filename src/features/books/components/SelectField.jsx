import { Field } from "@/components/common/Field";

export function SelectField({ label, value, onChange, options, htmlFor }) {
  return (
    <Field label={label} htmlFor={htmlFor}>
      {(id) => (
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 text-[15px] focus-visible:border-rani/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
