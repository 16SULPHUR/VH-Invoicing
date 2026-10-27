export function StatTile({ label, value, hint, accent = "text-foreground", className = "" }) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-surface px-4 py-3.5 ${className}`}>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1.5 font-display text-3xl font-bold tabular-nums leading-none tracking-tight ${accent}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
