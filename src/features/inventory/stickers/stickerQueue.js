import { useSyncExternalStore } from "react";
import { SEED_IDS } from "./designModel";

const QUEUE_KEY = "vh.stickerQueue";
const DESIGN_KEY = "vh.stickerDesign";
const LEGACY_STYLE_KEY = "vh.stickerStyle";

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

/** The old fixed style picker becomes a batch design choice; "refined" was the default anyway. */
function initialDesign() {
  const stored = read(DESIGN_KEY, null);
  if (stored !== null) return stored;
  const legacy = read(LEGACY_STYLE_KEY, "refined");
  return legacy === "band" || legacy === "block" ? SEED_IDS[legacy] : "";
}

let items = read(QUEUE_KEY, []);
let design = initialDesign();
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

function commit(next) {
  items = next;
  write(QUEUE_KEY, items);
  notify();
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
  /** New pieces of stock: adds to what is already queued rather than replacing it. */
  addPieces(products) {
    const pieces = products.filter(({ count }) => Number(count) >= 1);
    if (pieces.length === 0) return;
    const extra = new Map(pieces.map(({ id, count }) => [id, Math.floor(Number(count))]));
    const kept = items.map((item) => (extra.has(item.id) ? { ...item, count: item.count + extra.get(item.id) } : item));
    const added = [...extra].filter(([id]) => !items.some((item) => item.id === id)).map(([id, count]) => ({ id, count }));
    commit([...kept, ...added]);
  },
  setCount: (id, count) => commit(items.map((item) => (item.id === id ? { ...item, count: atLeastOne(count) } : item))),
  remove: (id) => commit(items.filter((item) => item.id !== id)),
  clear: () => commit([]),
  /** "" prints each product with its own design (supplier default or shop default). */
  setDesign(next) {
    design = next;
    write(DESIGN_KEY, design);
    notify();
  },
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useStickerQueue() {
  const queue = useSyncExternalStore(subscribe, () => items);
  const override = useSyncExternalStore(subscribe, () => design);
  return { queue, design: override };
}
