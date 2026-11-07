function Bar({ className = "" }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

/** Skeletons mirror the shape of what loads, rather than a generic spinner. */
export function TableSkeleton({ rows = 6, columns = 4 }) {
  return (
    <div className="space-y-2" aria-hidden>
      <Bar className="h-9 w-full" />
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Bar key={column} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TileSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <Bar key={index} className="h-24" />
      ))}
    </div>
  );
}
