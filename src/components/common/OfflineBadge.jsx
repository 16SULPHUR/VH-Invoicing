const BADGE_STYLES = {
  pending: {
    label: "Queued",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
  failed: {
    label: "Sync failed",
    className: "border-destructive/40 bg-destructive/10 text-destructive",
  },
};

export function OfflineBadge({ syncStatus }) {
  const badge = BADGE_STYLES[syncStatus];
  if (!badge) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
