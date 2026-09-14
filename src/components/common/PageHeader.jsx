export function PageHeader({ title, subtitle, actions, className = "" }) {
  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 ${className}`}
    >
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
