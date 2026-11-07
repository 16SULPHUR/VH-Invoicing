export function NoteField({ note, setNote }) {
  return (
    <textarea
      id="invoice-note"
      aria-label="Note"
      rows={2}
      value={note}
      onChange={(event) => setNote(event.target.value)}
      placeholder="Note for this bill…"
      className="flex w-full resize-none rounded-2xl border-[1.5px] border-border bg-surface-elevated px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-rani/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20 focus-visible:ring-offset-0"
    />
  );
}
