const sum = (items, pick) => items.reduce((total, item) => total + (pick(item) || 0), 0);

function costTotals(lines) {
  let cost = 0;
  let costedSales = 0;
  for (const line of lines) {
    if (line.kind === "adjustment" || line.cost == null) continue;
    cost += line.cost;
    costedSales += line.amount;
  }
  return { cost, costedSales };
}

/** Headline numbers for a set of prepared bills. Profit is measured on lines with a known cost and scaled to all sales. */
export function totals(bills) {
  const sold = bills.filter((bill) => bill.sales !== 0);
  const lines = bills.flatMap((bill) => bill.lines);
  const sales = sum(bills, (b) => b.sales);
  const { cost, costedSales } = costTotals(lines);
  const margin = costedSales > 0 ? (costedSales - cost) / costedSales : null;
  return {
    bills: sold.length,
    sales,
    returns: sum(bills, (b) => b.returns),
    adjustments: sum(bills, (b) => b.adjustments),
    items: sum(bills, (b) => b.items),
    averageBill: sold.length ? sales / sold.length : 0,
    cash: sum(bills, (b) => b.cash),
    upi: sum(bills, (b) => b.upi),
    credit: sum(bills, (b) => b.credit),
    discount: sum(lines, (l) => l.discount),
    margin,
    profit: margin == null ? null : sales * margin,
    costCoverage: sales > 0 ? costedSales / sales : 0,
    customers: new Set(sold.filter((b) => !b.walkIn).map((b) => b.customerKey)).size,
    walkIns: sold.filter((b) => b.walkIn).length,
  };
}

export function change(current, previous) {
  if (previous == null || current == null || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function groupBy(bills, key) {
  const groups = new Map();
  for (const bill of bills) {
    const k = key(bill);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(bill);
  }
  return groups;
}

export function byPeriod(bills, unit = "day") {
  const field = unit === "month" ? "month" : "day";
  return [...groupBy(bills, (b) => b[field]).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, group]) => ({ period, ...totals(group) }));
}

/** Every calendar day between two dates, so quiet days still show up. */
export function fillDays(rows, from, to) {
  const byDay = new Map(rows.map((row) => [row.period, row]));
  const out = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    const day = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    out.push(byDay.get(day) ?? { period: day, sales: 0, bills: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** 7 weekdays x 24 hours of sales. */
export function hourWeekGrid(bills) {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ sales: 0, bills: 0 })));
  for (const bill of bills) {
    if (bill.sales === 0) continue;
    const cell = grid[bill.weekday][bill.hour];
    cell.sales += bill.sales;
    cell.bills += 1;
  }
  return grid;
}

export function productRows(bills) {
  const rows = new Map();
  for (const bill of bills) {
    for (const line of bill.lines) {
      if (line.kind === "adjustment") continue;
      const row = rows.get(line.name) ?? {
        name: line.name,
        supplier: line.product?.supplier ?? "Not in stock list",
        stock: line.product?.stock ?? null,
        known: Boolean(line.product),
        quantity: 0,
        sales: 0,
        cost: 0,
        costedSales: 0,
        discount: 0,
        bills: new Set(),
        lastSold: bill.date,
      };
      row.quantity += line.quantity;
      row.sales += line.amount;
      row.discount += line.discount;
      if (line.cost != null) {
        row.cost += line.cost;
        row.costedSales += line.amount;
      }
      row.bills.add(bill.key);
      if (bill.date > row.lastSold) row.lastSold = bill.date;
      rows.set(line.name, row);
    }
  }
  return [...rows.values()].map((row) => ({
    ...row,
    bills: row.bills.size,
    profit: row.costedSales ? row.costedSales - row.cost : null,
    margin: row.costedSales > 0 ? (row.costedSales - row.cost) / row.costedSales : null,
  }));
}

export function supplierRows(products, index) {
  const rows = new Map();
  const ensure = (name) => {
    if (!rows.has(name)) rows.set(name, { supplier: name, sales: 0, quantity: 0, profit: 0, costedSales: 0, designs: 0, stockUnits: 0, stockCost: 0 });
    return rows.get(name);
  };
  for (const product of products) {
    const row = ensure(product.supplier);
    row.sales += product.sales;
    row.quantity += product.quantity;
    row.designs += 1;
    if (product.profit != null) {
      row.profit += product.profit;
      row.costedSales += product.costedSales;
    }
  }
  for (const entry of index?.byName.values() ?? []) {
    const row = ensure(entry.supplier);
    if (entry.stock > 0) {
      row.stockUnits += entry.stock;
      row.stockCost += entry.stock * entry.cost;
    }
  }
  return [...rows.values()].map((row) => ({
    ...row,
    margin: row.costedSales > 0 ? row.profit / row.costedSales : null,
    sellThrough: row.quantity + row.stockUnits > 0 ? row.quantity / (row.quantity + row.stockUnits) : null,
  }));
}

export function customerRows(bills, allBills = bills) {
  const firstSeen = new Map();
  for (const bill of allBills) {
    if (bill.walkIn) continue;
    const seen = firstSeen.get(bill.customerKey);
    if (!seen || bill.date < seen) firstSeen.set(bill.customerKey, bill.date);
  }
  const rows = new Map();
  for (const bill of bills) {
    if (bill.walkIn || bill.sales === 0) continue;
    const row = rows.get(bill.customerKey) ?? {
      key: bill.customerKey,
      name: bill.customerName,
      phone: bill.customerPhone,
      bills: 0,
      sales: 0,
      credit: 0,
      items: 0,
      first: firstSeen.get(bill.customerKey),
      last: bill.date,
    };
    row.bills += 1;
    row.sales += bill.sales;
    row.credit += bill.credit;
    row.items += bill.items;
    if (bill.date >= row.last) {
      row.last = bill.date;
      row.name = bill.customerName;
      if (bill.customerPhone) row.phone = bill.customerPhone;
    }
    rows.set(bill.customerKey, row);
  }
  return [...rows.values()].map((row) => ({ ...row, averageBill: row.sales / row.bills }));
}

/** Stock on hand valued at cost, and how long each design has sat since it last sold (or was added). */
export function stockRows(index, lastSoldByName) {
  const now = Date.now();
  return [...(index?.byName.values() ?? [])].map((entry) => {
    const lastSold = lastSoldByName.get(entry.name) ?? null;
    const since = lastSold ?? (entry.createdAt ? new Date(entry.createdAt) : null);
    return {
      ...entry,
      lastSold,
      idleDays: since ? Math.floor((now - since.getTime()) / 86_400_000) : null,
      stockCost: Math.max(0, entry.stock) * entry.cost,
      stockValue: Math.max(0, entry.stock) * entry.price,
    };
  });
}

export function lastSoldMap(bills) {
  const map = new Map();
  for (const bill of bills) {
    for (const line of bill.lines) {
      if (line.kind !== "sale") continue;
      const seen = map.get(line.name);
      if (!seen || bill.date > seen) map.set(line.name, bill.date);
    }
  }
  return map;
}
