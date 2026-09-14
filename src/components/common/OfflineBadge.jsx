const BADGE_STYLES = {
  pending: {
    label: "Offline",
    className: "bg-amber-900/60 text-amber-300 border-amber-500/40",
    dot: "bg-amber-400 animate-pulse",
  },
  failed: {
    label: "Sync Failed",
    className: "bg-red-900/60 text-red-300 border-red-500/40",
    dot: "bg-red-400",
  },
};

export function OfflineBadge({ syncStatus }) {
  const badge = BADGE_STYLES[syncStatus];
  if (!badge) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
      {badge.label}
    </span>
  );
}
