import { useState, useEffect, useCallback } from "react";
import { db } from "../lib/offlineDb";
import { syncManager } from "../lib/syncManager";

// Actual connectivity check — navigator.onLine is unreliable on some platforms
async function checkRealConnectivity() {
  if (!navigator.onLine) return false;
  try {
    const resp = await fetch("https://basihmnebvsflzkaivds.supabase.co/rest/v1/", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
    });
    return true;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | error | auth_required

  const recheckOnline = useCallback(async () => {
    const real = await checkRealConnectivity();
    setIsOnline(real);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      // Don't trust the event blindly — verify
      recheckOnline();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Do an initial real check
    recheckOnline();

    const unsubscribe = syncManager.subscribe((event) => {
      switch (event.type) {
        case "online":
          recheckOnline();
          break;
        case "offline":
          setIsOnline(false);
          break;
        case "sync_started":
          setSyncStatus("syncing");
          break;
        case "sync_completed":
          setSyncStatus("idle");
          setLastSyncTime(event.lastSyncTime);
          break;
        case "sync_error":
          setSyncStatus("error");
          break;
        case "auth_required":
          setSyncStatus("auth_required");
          break;
        case "queue_updated":
        case "item_synced":
        case "item_failed":
          updatePendingCount();
          break;
      }
    });

    // Initial count
    updatePendingCount();

    // Poll pending count and recheck connectivity periodically
    const interval = setInterval(() => {
      updatePendingCount();
      recheckOnline();
    }, 5000);

    async function updatePendingCount() {
      try {
        const state = await syncManager.getSyncState();
        setPendingSyncCount(state.totalCount);
        if (state.lastSyncTime) {
          setLastSyncTime(state.lastSyncTime);
        }
      } catch (err) {
        // IndexedDB may not be ready yet
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [recheckOnline]);

  return { isOnline, pendingSyncCount, lastSyncTime, syncStatus };
}
