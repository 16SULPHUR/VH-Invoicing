import { useState } from "react";
import { RefreshCw, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSyncManager } from "@/hooks/useSyncManager";
import { ICON_STROKE } from "@/config/navigation";

function formatLastSync(timestamp) {
  if (!timestamp) return "Never";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function SyncStatusBar({ variant = "compact" }) {
  const { isOnline, pendingSyncCount, lastSyncTime, syncStatus } = useOnlineStatus();
  const { triggerSync, isSyncing, syncErrors, retryFailed } = useSyncManager();
  const [open, setOpen] = useState(false);

  const outstanding = pendingSyncCount + syncErrors.length;
  const statusLabel = isOnline ? "Online" : "Offline";

  return (
    <>
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Sync status: ${statusLabel}${outstanding ? `, ${outstanding} outstanding` : ""}`}
          className="press flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs font-medium text-indigo-foreground transition-colors hover:bg-white/10"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              !isOnline ? "bg-destructive" : outstanding ? "bg-marigold" : "bg-emerald-400"
            }`}
            aria-hidden
          />
          <span className="truncate">
            {!isOnline
              ? "Offline"
              : outstanding
                ? `${outstanding} waiting to sync`
                : `Synced ${formatLastSync(lastSyncTime).toLowerCase()}`}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Sync status: ${statusLabel}${outstanding ? `, ${outstanding} outstanding` : ""}`}
          className="press relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {isOnline ? (
            <Wifi size={18} strokeWidth={ICON_STROKE} className="text-success" aria-hidden />
          ) : (
            <WifiOff size={18} strokeWidth={ICON_STROKE} className="text-destructive" aria-hidden />
          )}
          {outstanding > 0 && (
            <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-marigold px-1 text-[10px] font-bold text-marigold-foreground">
              {outstanding}
            </span>
          )}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-success" aria-hidden />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" aria-hidden />
              )}
              {statusLabel}
            </DialogTitle>
            <DialogDescription>Sync status and pending changes</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    pendingSyncCount > 0 ? "text-warning" : "text-foreground"
                  }`}
                >
                  {pendingSyncCount}
                </p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Failed</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    syncErrors.length > 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {syncErrors.length}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Last synced: {formatLastSync(lastSyncTime)}
            </p>

            {syncStatus === "auth_required" && (
              <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                Log in again to resume syncing.
              </p>
            )}

            {syncErrors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Failed items</p>
                {syncErrors.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs"
                  >
                    <span className="text-destructive">
                      <span className="font-semibold capitalize">{entry.type}</span> {entry.table}:{" "}
                      {entry.error || "Unknown error"} (retries: {entry.retryCount})
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {syncErrors.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryFailed}
                  disabled={isSyncing || !isOnline}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Retry failed
                </Button>
              )}
              <Button
                size="sm"
                onClick={triggerSync}
                disabled={isSyncing || !isOnline || pendingSyncCount === 0}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {isSyncing ? "Syncing…" : "Sync now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
