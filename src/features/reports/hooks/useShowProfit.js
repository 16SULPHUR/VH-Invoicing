import { useSyncExternalStore } from "react";

const KEY = "vh.showProfit";

const read = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

let current = read();
const listeners = new Set();

export function setShowProfit(value) {
  current = Boolean(value);
  try {
    localStorage.setItem(KEY, current ? "on" : "off");
  } catch {
    // Blocked storage: the choice lasts for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key !== KEY) return;
    current = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/** Whether profit figures are shown on this device. */
export const useShowProfit = () => [useSyncExternalStore(subscribe, () => current), setShowProfit];
