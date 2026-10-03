import { toNumber } from "@/utils/formatters";

// Every block on the printed A5 bill has a fixed height (mm), so pages can be laid out without measuring.
export const BILL_MM = {
  body: 187,
  gap: 3,
  firstHead: 39.5,
  nextHead: 12,
  thead: 4.5,
  tfoot: 5.5,
  row: 5.6,
  tallRow: 8.6,
  footer: 73,
  safety: 2,
};

export const TALL_NAME_CHARS = 52;

export function lineTotal(line) {
  const amount = parseFloat(line.amount);
  return Number.isFinite(amount) ? amount : toNumber(line.price) * toNumber(line.quantity);
}

const rowHeight = (line) =>
  String(line.name ?? "").length > TALL_NAME_CHARS ? BILL_MM.tallRow : BILL_MM.row;

/**
 * Splits bill lines into A5 pages. Rows never split, later pages open with the
 * amount brought forward, and the last page always carries at least one row
 * plus the totals, QR codes, terms and signature.
 */
export function paginateBill(lines) {
  const rows = lines.map((line, index) => ({ line, index, height: rowHeight(line), amount: lineTotal(line) }));
  const pages = [];
  let start = 0;

  for (;;) {
    const first = pages.length === 0;
    const room =
      BILL_MM.body - (first ? BILL_MM.firstHead : BILL_MM.nextHead) - BILL_MM.thead - BILL_MM.tfoot - BILL_MM.safety;
    const broughtRow = first ? 0 : BILL_MM.row;
    const rest = rows.slice(start);
    const restHeight = rest.reduce((sum, row) => sum + row.height, 0);

    if (broughtRow + restHeight <= room - BILL_MM.footer) {
      pages.push(rest);
      break;
    }

    let used = broughtRow;
    let count = 0;
    while (count < rest.length && used + rest[count].height <= room) {
      used += rest[count].height;
      count += 1;
    }
    if (count === rest.length) count -= 1;
    count = Math.max(count, 1);

    pages.push(rest.slice(0, count));
    start += count;
  }

  let running = 0;
  return pages.map((pageRows, index) => {
    const broughtForward = running;
    running += pageRows.reduce((sum, row) => sum + row.amount, 0);
    return {
      number: index + 1,
      rows: pageRows,
      broughtForward,
      carriedForward: running,
      isFirst: index === 0,
      isLast: index === pages.length - 1,
    };
  });
}
