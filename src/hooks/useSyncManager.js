import { useState, useCallback, useEffect } from "react";
import { syncManager } from "../lib/syncManager";
import { db } from "../lib/offlineDb";

export function useSyncManager() {
  const [syncErrors, setSyncErrors] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Subscribe to sync manager events to update errors
  useEffect(() => {
    const unsubscribe = syncManager.subscribe(async (event) => {
      if (
        event.type === "sync_completed" ||
        event.type === "item_failed" ||
        event.type === "queue_updated"
      ) {
        const failed = await db.syncQueue
          .where("status")
          .equals("failed")
          .toArray();
        setSyncErrors(failed);
      }
      if (event.type === "sync_started") {
        setIsSyncing(true);
      }
      if (
        event.type === "sync_completed" ||
        event.type === "sync_error"
      ) {
        setIsSyncing(false);
      }
    });

    // Load initial failed items
    (async () => {
      try {
        const failed = await db.syncQueue
          .where("status")
          .equals("failed")
          .toArray();
        setSyncErrors(failed);
      } catch (err) {
        // IndexedDB may not be ready
      }
    })();

    return unsubscribe;
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncManager.processQueue();
    } finally {
      setIsSyncing(false);
      const failed = await db.syncQueue
        .where("status")
        .equals("failed")
        .toArray();
      setSyncErrors(failed);
    }
  }, [isSyncing]);

  const dismissError = useCallback(async (queueId) => {
    await syncManager.dismissError(queueId);
    setSyncErrors((prev) => prev.filter((e) => e.id !== queueId));
  }, []);

  const retryFailed = useCallback(async () => {
    await syncManager.retryFailed();
  }, []);

  return { triggerSync, isSyncing, syncErrors, dismissError, retryFailed };
}
