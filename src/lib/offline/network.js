const NETWORK_ERROR_HINTS = [
  "failed to fetch",
  "networkerror",
  "network request failed",
  "err_internet_disconnected",
  "load failed",
];

export function isOnline() {
  return navigator.onLine;
}

export function isNetworkError(error) {
  if (!error) return false;
  if (error.code === "NETWORK_ERROR") return true;
  const message = String(error.message || "").toLowerCase();
  return NETWORK_ERROR_HINTS.some((hint) => message.includes(hint));
}

export function generateOfflineId() {
  const random = Math.random().toString(36).slice(2, 6);
  return `OFFLINE-${Date.now()}-${random}`;
}

// Runs `online` and falls back to `offline` whenever the failure looks like a
// dropped connection. Real errors (validation, RLS, constraints) still propagate.
export async function withOfflineFallback(online, offline) {
  if (!isOnline()) return offline();
  try {
    return await online();
  } catch (error) {
    if (isNetworkError(error)) return offline();
    throw error;
  }
}
