export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center ${className}`}
    >
      {Icon && <Icon className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} aria-hidden />}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
