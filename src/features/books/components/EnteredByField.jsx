import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";

export function EnteredByField({ id, value, onChange }) {
  return (
    <Field label="Entered by" htmlFor={id}>
      {(fieldId) => (
        <Input
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Your name"
          autoComplete="off"
        />
      )}
    </Field>
  );
}
