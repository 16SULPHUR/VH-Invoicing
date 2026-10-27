export function PageLoader({ label = "Loading…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-full min-h-[50vh] items-center justify-center text-sm text-muted-foreground"
    >
      {label}
    </div>
  );
}
