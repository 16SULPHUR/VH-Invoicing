import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";
import { syncManager } from "@/lib/offline/syncManager";

const POLL_INTERVAL_MS = 5000;

// navigator.onLine only reports whether a network interface exists, so confirm
// that our backend is actually reachable before trusting it.
async function checkRealConnectivity() {
  if (!navigator.onLine) return false;
  try {
    await fetch(`${env.supabaseUrl}/rest/v1/`, {
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
  const [syncStatus, setSyncStatus] = useState("idle");

  const recheckOnline = useCallback(async () => {
    setIsOnline(await checkRealConnectivity());
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const state = await syncManager.getSyncState();
      setPendingSyncCount(state.totalCount);
      if (state.lastSyncTime) setLastSyncTime(state.lastSyncTime);
    } catch {
      // IndexedDB may not be open yet; the next poll will pick it up.
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => recheckOnline();
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    recheckOnline();
    refreshPendingCount();

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
        default:
          refreshPendingCount();
      }
    });

    const interval = setInterval(() => {
      refreshPendingCount();
      recheckOnline();
    }, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, [recheckOnline, refreshPendingCount]);

  return { isOnline, pendingSyncCount, lastSyncTime, syncStatus };
}
