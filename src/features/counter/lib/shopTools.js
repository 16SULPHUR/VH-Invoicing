import { phoneDigits, todayLocal } from "@/features/customers/lib/customerKey";

export { todayLocal };

const DAY = 86_400_000;

const localDate = (iso) => {
  const [year, month, day] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function addDays(iso, days) {
  const date = localDate(iso);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Whole days from today to the date: 0 today, negative when it has passed. */
export function daysUntil(iso) {
  if (!iso) return null;
  return Math.round((localDate(iso) - localDate(todayLocal())) / DAY);
}

export function dueLabel(iso) {
  const days = daysUntil(iso);
  if (days === null) return "No date";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "1 day late";
  if (days < 0) return `${-days} days late`;
  if (days < 7) return `In ${days} days`;
  return shortDate(iso);
}

export function shortDate(iso) {
  if (!iso) return "";
  return localDate(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const rupees = (value) => Math.max(0, Math.round(Number(value) || 0));

export const formatPhone = (phone) => {
  const digits = phoneDigits(phone);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : String(phone ?? "");
};

export const newKey = () => Math.random().toString(36).slice(2, 10);

/** A scanned tag can hold the bare code or a link ending in it. */
export function normalizeCode(text) {
  const raw = String(text ?? "").trim();
  if (!/^https?:\/\//i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.searchParams.get("code") || url.pathname.split("/").filter(Boolean).pop() || raw;
  } catch {
    return raw;
  }
}

export function findByCode(products, code) {
  const needle = normalizeCode(code);
  if (!needle) return null;
  return products.find((product) => String(product.barcode ?? "") === needle) ?? null;
}

export function searchProducts(products, term, limit = 8) {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  const exact = products.filter((product) => String(product.barcode ?? "") === needle);
  const rest = products.filter(
    (product) => !exact.includes(product) && [product.name, product.barcode].some((field) => String(field ?? "").toLowerCase().includes(needle))
  );
  return [...exact, ...rest].slice(0, limit);
}

/** Token, name or phone. */
export function matchesRecord(record, term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  return (
    String(record.token ?? "").toLowerCase() === needle ||
    String(record.token ?? "").toLowerCase().includes(needle) ||
    String(record.customer_name ?? "").toLowerCase().includes(needle) ||
    (digits.length >= 3 && phoneDigits(record.customer_phone).includes(digits))
  );
}

/** Stock changes for pieces from the catalogue; free-text lines never touch stock. */
export function stockMoves(lines, sign) {
  return lines
    .filter((line) => line.product_id && Number(line.quantity) > 0)
    .map((line) => ({ product_id: String(line.product_id), name: line.name, delta: sign * Number(line.quantity) }));
}

/** What to move when held lines change from `before` to `after` (both still held). */
export function heldDiff(before, after) {
  const totals = new Map();
  const add = (lines, sign) => {
    for (const line of lines) {
      if (!line.product_id) continue;
      const id = String(line.product_id);
      const entry = totals.get(id) ?? { product_id: id, name: line.name, delta: 0 };
      entry.delta += sign * (Number(line.quantity) || 0);
      totals.set(id, entry);
    }
  };
  add(before, 1);
  add(after, -1);
  return [...totals.values()].filter((move) => move.delta !== 0);
}

export const linesTotal = (lines) => lines.reduce((sum, line) => sum + rupees(line.price) * (Number(line.quantity) || 0), 0);

export const pieceCount = (lines) => lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);

export function lineFromProduct(product, quantity = 1) {
  return {
    key: newKey(),
    product_id: String(product.id),
    barcode: product.barcode == null ? null : String(product.barcode),
    name: product.name,
    price: rupees(product.sellingPrice),
    quantity,
  };
}

/** Adds one more of a product, or a new line for it. */
export function addPiece(lines, product) {
  const id = String(product.id);
  const index = lines.findIndex((line) => line.product_id === id);
  if (index === -1) return [...lines, lineFromProduct(product)];
  return lines.map((line, i) => (i === index ? { ...line, quantity: line.quantity + 1 } : line));
}
