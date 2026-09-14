export function StatTile({ label, value, hint, accent = "text-foreground", className = "" }) {
  return (
    <div className={`rounded-lg border border-border bg-surface px-4 py-3 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
