import { useCallback, useEffect, useState } from "react";

const KEY = "vh-parked-bills";
const CHANGED = "vh-parked-bills-changed";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

function write(bills) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bills));
  } catch {
    // Storage full or blocked; parked bills just won't survive a reload.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export const isBlankBill = (bill) =>
  bill.lines.length === 0 && !bill.customerName && !bill.customerNumber && !bill.note;

/** Bills set aside on this device so the till is free for the next customer. */
export function useParkedBills() {
  const [bills, setBills] = useState(read);

  useEffect(() => {
    const sync = () => setBills(read());
    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const park = useCallback((bill) => {
    const entry = { ...bill, id: crypto.randomUUID(), parkedAt: Date.now() };
    write([entry, ...read()]);
    return entry;
  }, []);

  const take = useCallback((id) => {
    const all = read();
    const found = all.find((bill) => bill.id === id);
    write(all.filter((bill) => bill.id !== id));
    return found;
  }, []);

  const discard = useCallback((id) => write(read().filter((bill) => bill.id !== id)), []);

  return { bills, park, take, discard };
}
