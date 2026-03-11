import React, { useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useSyncManager } from "../hooks/useSyncManager";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SyncStatusBar = React.forwardRef(({ ...props }, ref) => {
  const { isOnline, pendingSyncCount, lastSyncTime, syncStatus } =
    useOnlineStatus();
  const { triggerSync, isSyncing, syncErrors, dismissError, retryFailed } =
    useSyncManager();
  const [open, setOpen] = useState(false);

  const formatLastSync = (timestamp) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const hasIssues = pendingSyncCount > 0 || syncErrors.length > 0;

  return (
    <>
      {/* Trigger button — sits in the nav bar */}
      <div
        ref={ref}
        {...props}
        onClick={() => setOpen(true)}
        className="px-4 py-2 flex items-center cursor-pointer transition-colors text-gray-400 hover:text-gray-300 relative"
      >
        {isOnline ? (
          <Wifi className="h-5 w-5 text-green-400" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-400" />
        )}
        {hasIssues && (
          <span className="absolute -top-0 -right-0 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-amber-500 text-black text-[10px] font-bold">
            {pendingSyncCount + syncErrors.length}
          </span>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-400" />
              )}
              {isOnline ? "Online" : "Offline"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Sync status and pending changes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">Pending</p>
                <p className={`text-xl font-bold ${pendingSyncCount > 0 ? "text-amber-400" : "text-gray-300"}`}>
                  {pendingSyncCount}
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400">Failed</p>
                <p className={`text-xl font-bold ${syncErrors.length > 0 ? "text-red-400" : "text-gray-300"}`}>
                  {syncErrors.length}
                </p>
              </div>
            </div>

            <div className="text-xs text-gray-400">
              Last synced: {formatLastSync(lastSyncTime)}
            </div>

            {syncStatus === "auth_required" && (
              <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 text-sm text-amber-300">
                Re-login required to sync
              </div>
            )}

            {/* Failed items list */}
            {syncErrors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-400">Failed items:</p>
                {syncErrors.map((err) => (
                  <div
                    key={err.id}
                    className="flex items-center justify-between bg-red-900/20 border border-red-800/40 rounded px-3 py-2 text-xs"
                  >
                    <div className="text-red-300">
                      <span className="font-semibold capitalize">{err.type}</span>{" "}
                      {err.table} — {err.error || "Unknown error"}
                      <span className="text-red-500 ml-2">
                        (retries: {err.retryCount})
                      </span>
                    </div>
                    <button
                      onClick={() => dismissError(err.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {syncErrors.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 border-red-800 hover:bg-red-900/30 hover:text-red-300"
                  onClick={retryFailed}
                  disabled={isSyncing || !isOnline}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Retry Failed
                </Button>
              )}

              <Button
                size="sm"
                className="bg-pink-500 hover:bg-pink-600 text-white"
                onClick={triggerSync}
                disabled={isSyncing || !isOnline || pendingSyncCount === 0}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

SyncStatusBar.displayName = "SyncStatusBar";

export default SyncStatusBar;
