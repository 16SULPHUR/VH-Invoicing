import React from "react";

const OfflineBadge = ({ syncStatus }) => {
  if (!syncStatus || syncStatus === "synced") return null;

  if (syncStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-900/60 text-amber-300 border border-amber-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Offline
      </span>
    );
  }

  if (syncStatus === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300 border border-red-500/40">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Sync Failed
      </span>
    );
  }

  return null;
};

export default OfflineBadge;
