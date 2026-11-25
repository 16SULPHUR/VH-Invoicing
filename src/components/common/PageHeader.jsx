export function PageHeader({ title, subtitle, actions, className = "" }) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-3 pb-2 ${className}`}>
      <div className="min-w-0">
        <h1 className="truncate font-display text-3xl font-extrabold leading-none tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
