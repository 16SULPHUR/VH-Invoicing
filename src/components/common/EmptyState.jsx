export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface/70 px-6 py-12 text-center ${className}`}
    >
      {Icon && <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />}
      <div className="space-y-1">
        <p className="font-display text-lg font-bold tracking-tight text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
