import { rupees } from "./shopTools";

export const outstanding = (line) => Math.max(0, line.quantity - (line.returned || 0) - (line.sold || 0));

export const outCount = (approval) => approval.lines.reduce((sum, line) => sum + outstanding(line), 0);

export const outValue = (approval) => approval.lines.reduce((sum, line) => sum + outstanding(line) * rupees(line.price), 0);

/**
 * Applies what came back and what was kept. Returned pieces go back into stock; kept pieces
 * also go back into stock for a moment, because the till takes them out when it bills them.
 * `added` are new pieces taken home now, which leave stock.
 */
export function settleApproval(approval, picks, added, at) {
  const moves = [];
  const sold = [];
  const lines = approval.lines.map((line) => {
    const pick = picks[line.key];
    const left = outstanding(line);
    const returned = Math.min(left, pick?.returned || 0);
    const kept = Math.min(left - returned, pick?.sold || 0);
    if (!returned && !kept) return line;
    if (returned) moves.push({ product_id: line.product_id, name: line.name, delta: returned, reason: "approval_return" });
    if (kept) {
      moves.push({ product_id: line.product_id, name: line.name, delta: kept, reason: "approval_sold" });
      sold.push({ ...line, quantity: kept });
    }
    return {
      ...line,
      returned: (line.returned || 0) + returned,
      sold: (line.sold || 0) + kept,
      ...(kept ? { till_at: at } : {}),
    };
  });
  for (const line of added) {
    moves.push({ product_id: line.product_id, name: line.name, delta: -line.quantity, reason: "approval_out" });
  }
  const next = [...lines, ...added.map((line) => ({ ...line, returned: 0, sold: 0 }))];
  return { lines: next, moves, sold, closed: next.every((line) => outstanding(line) === 0) };
}
