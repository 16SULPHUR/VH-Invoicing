import { Field } from "@/components/common/Field";

export function NoteField({ note, setNote }) {
  return (
    <Field label="Note" htmlFor="invoice-note">
      <textarea
        id="invoice-note"
        rows={2}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        className="flex w-full rounded-md border border-input bg-surface px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </Field>
  );
}
