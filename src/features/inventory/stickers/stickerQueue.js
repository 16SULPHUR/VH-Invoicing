import { useSyncExternalStore } from "react";

export const STICKER_STYLES = [
  { value: "refined", label: "Refined" },
  { value: "band", label: "Price band" },
  { value: "block", label: "Block print" },
];

const QUEUE_KEY = "vh.stickerQueue";
const STYLE_KEY = "vh.stickerStyle";

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the queue still works for this visit.
  }
}

let items = read(QUEUE_KEY, []);
let style = read(STYLE_KEY, "refined");
const listeners = new Set();

function commit(next) {
  items = next;
  write(QUEUE_KEY, items);
  listeners.forEach((listener) => listener());
}

const atLeastOne = (count) => Math.max(1, Math.floor(Number(count) || 1));

/** Products waiting for stickers, kept across visits so stock added today can be printed later. */
export const stickerQueue = {
  add(products) {
    const counts = new Map(products.map(({ id, count }) => [id, atLeastOne(count)]));
    const kept = items.map((item) => (counts.has(item.id) ? { ...item, count: counts.get(item.id) } : item));
    const added = [...counts]
      .filter(([id]) => !items.some((item) => item.id === id))
      .map(([id, count]) => ({ id, count }));
    commit([...kept, ...added]);
  },
  setCount: (id, count) => commit(items.map((item) => (item.id === id ? { ...item, count: atLeastOne(count) } : item))),
  remove: (id) => commit(items.filter((item) => item.id !== id)),
  clear: () => commit([]),
  setStyle(next) {
    style = next;
    write(STYLE_KEY, style);
    listeners.forEach((listener) => listener());
  },
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useStickerQueue() {
  const queue = useSyncExternalStore(subscribe, () => items);
  const currentStyle = useSyncExternalStore(subscribe, () => style);
  return { queue, style: currentStyle };
}
