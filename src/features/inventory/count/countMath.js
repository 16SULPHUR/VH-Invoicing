export const SCOPES = [
  { value: "all", label: "Whole shop" },
  { value: "supplier", label: "One supplier" },
  { value: "negative", label: "Negative stock" },
];

export function inScope(count, product) {
  if (count.scope === "supplier") return String(product.supplier ?? "") === String(count.supplier ?? "");
  if (count.scope === "negative") return (Number(product.quantity) || 0) < 0;
  return true;
}

/** Counted pieces per product id, plus codes that matched no product. */
export function tally(scans) {
  const counted = new Map();
  const unknown = new Map();
  for (const scan of scans) {
    const quantity = Number(scan.quantity) || 0;
    if (scan.product_id) counted.set(String(scan.product_id), (counted.get(String(scan.product_id)) ?? 0) + quantity);
    else unknown.set(scan.code, (unknown.get(scan.code) ?? 0) + quantity);
  }
  return { counted, unknown };
}

/**
 * One row per product that needs a decision: counted but different, in scope but not found,
 * counted outside the scope, or negative in the system. `apply` is the suggested tick.
 */
export function reviewRows(count, products, scans) {
  const { counted, unknown } = tally(scans);
  const rows = [];
  for (const product of products) {
    const id = String(product.id);
    const system = Number(product.quantity) || 0;
    const scoped = inScope(count, product);
    const found = counted.get(id) ?? 0;
    if (!scoped && !counted.has(id)) continue;
    const kind = !scoped ? "outside" : !counted.has(id) ? "missing" : found === system ? "match" : "different";
    if (kind === "missing" && system === 0) continue;
    rows.push({
      id,
      product,
      system,
      counted: found,
      delta: found - system,
      kind,
      negative: system < 0,
      apply: kind === "different" || (kind === "missing" && (count.scope !== "all" || system < 0)),
    });
  }
  const order = { different: 0, missing: 1, outside: 2, match: 3 };
  rows.sort((a, b) => order[a.kind] - order[b.kind] || Math.abs(b.delta) - Math.abs(a.delta));
  return { rows, unknown: [...unknown].map(([code, quantity]) => ({ code, quantity })) };
}
