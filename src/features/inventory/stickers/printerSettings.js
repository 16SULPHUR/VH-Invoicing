import { useSyncExternalStore } from "react";

const KEY = "vh.labelPrinter";
const DEFAULTS = { x: 0, y: 0, dpi: 203 };

function read() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return DEFAULTS;
  }
}

let current = read();
const listeners = new Set();

/** This device's label printer: alignment offset in mm and resolution. Never shared between tills. */
export const printerSettings = {
  set(changes) {
    current = { ...current, ...changes };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      // Blocked storage: keep the setting for this visit.
    }
    listeners.forEach((listener) => listener());
  },
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePrinterSettings = () => useSyncExternalStore(subscribe, () => current);

export const DPI_OPTIONS = [203, 300];
