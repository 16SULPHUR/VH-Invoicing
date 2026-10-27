import { parseInvoiceLines } from "@/utils/invoice";

const DAY = 86_400_000;
const nameKey = (name) => String(name ?? "").trim().toLowerCase();

/** When each product last sold, from bill lines: matched by code first, then by name. */
export function lastSoldIndex(invoices, products) {
  const byCode = new Map();
  const byName = new Map();
  for (const product of products) {
    if (product.barcode != null && product.barcode !== "") byCode.set(String(product.barcode), String(product.id));
    const key = nameKey(product.name);
    if (key && !byName.has(key)) byName.set(key, String(product.id));
  }
  const last = new Map();
  for (const invoice of invoices) {
    for (const line of parseInvoiceLines(invoice.products)) {
      const id = byCode.get(String(line?.barcode ?? "")) ?? byName.get(nameKey(line?.name));
      if (!id) continue;
      const previous = last.get(id);
      if (!previous || String(invoice.date) > String(previous)) last.set(id, invoice.date);
    }
  }
  return last;
}

/**
 * Products with stock that are old: not sold in `days` days and added before then ("sale"),
 * or simply added more than `days` days ago ("added").
 */
export function oldStockRows(products, lastSold, { days, basis, now = Date.now() }) {
  const cutoff = new Date(now - days * DAY).toISOString();
  return products
    .filter((product) => (Number(product.quantity) || 0) > 0)
    .map((product) => {
      const id = String(product.id);
      const quantity = Number(product.quantity) || 0;
      const cost = Number(product.cost) || 0;
      return {
        product,
        id,
        quantity,
        cost,
        value: cost * quantity,
        lastSold: lastSold.get(id) ?? null,
        added: product.created_at ?? null,
        ageDays: product.created_at ? Math.floor((now - new Date(product.created_at).getTime()) / DAY) : null,
      };
    })
    .filter((row) => {
      const addedBefore = !row.added || row.added < cutoff;
      if (basis === "added") return Boolean(row.added) && addedBefore;
      return addedBefore && (!row.lastSold || row.lastSold < cutoff);
    });
}

export function groupBySupplier(rows, suppliers) {
  const names = new Map(suppliers.map((supplier) => [String(supplier.id), supplier.name]));
  const groups = new Map();
  for (const row of rows) {
    const key = String(row.product.supplier ?? "");
    const group = groups.get(key) ?? { key, name: names.get(key) ?? (key ? `Supplier ${key}` : "No supplier"), rows: [], pieces: 0, value: 0 };
    group.rows.push(row);
    group.pieces += row.quantity;
    group.value += row.value;
    groups.set(key, group);
  }
  for (const group of groups.values()) group.rows.sort((a, b) => b.value - a.value || b.quantity - a.quantity);
  return [...groups.values()].sort((a, b) => b.value - a.value);
}
