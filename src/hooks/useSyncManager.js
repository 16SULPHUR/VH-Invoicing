import { useCallback, useEffect, useState } from "react";
import { syncManager } from "@/lib/offline/syncManager";

export function useSyncManager() {
  const [syncErrors, setSyncErrors] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshErrors = useCallback(async () => {
    try {
      setSyncErrors(await syncManager.listFailed());
    } catch {
      // IndexedDB may not be open yet.
    }
  }, []);

  useEffect(() => {
    refreshErrors();

    return syncManager.subscribe((event) => {
      if (event.type === "sync_started") setIsSyncing(true);
      if (event.type === "sync_completed" || event.type === "sync_error") setIsSyncing(false);
      if (["sync_completed", "item_failed", "queue_updated"].includes(event.type)) {
        refreshErrors();
      }
    });
  }, [refreshErrors]);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncManager.processQueue();
    } finally {
      setIsSyncing(false);
      refreshErrors();
    }
  }, [isSyncing, refreshErrors]);

  const retryFailed = useCallback(() => syncManager.retryFailed(), []);

  return { triggerSync, isSyncing, syncErrors, retryFailed };
}
