import { parseInvoiceLines } from "@/utils/invoice";
import { invoiceCustomerKey } from "@/features/customers/lib/customerKey";
import { localISODate } from "@/utils/date";

/**
 * Case-insensitive patterns for lines that move money but are not goods (old dues, deposits, advances).
 * Shared with the ledger trigger through the non_sale_line_patterns table; these apply until it exists.
 */
export const DEFAULT_NON_SALE = ["^(CASH )?JAMA", "OLD CREDIT", "^CREDIT( [0-9/.-]+)?$", "^UPDATED CREDIT", "\\yADVANCE$"];

/** Patterns are stored in Postgres syntax, where \y is the word boundary. */
export const toJsPattern = (pattern) => pattern.replace(/\\y/g, "\\b");
export const toPgPattern = (pattern) => pattern.replace(/\\b/g, "\\y");

export function compilePatterns(patterns) {
  return patterns.flatMap((pattern) => {
    try {
      return [new RegExp(toJsPattern(pattern), "i")];
    } catch {
      return [];
    }
  });
}

export const normName = (name) => String(name ?? "").trim().toUpperCase().replace(/\s+/g, " ");

const num = (value) => Number(value) || 0;

/** Name and barcode lookups into the product list; duplicate names share an average cost. */
export function buildProductIndex(products = [], suppliers = []) {
  const supplierNames = new Map(suppliers.map((s) => [String(s.id), s.name]));
  const byName = new Map();
  const byBarcode = new Map();
  for (const product of products) {
    const entry = {
      id: product.id,
      name: normName(product.name),
      cost: num(product.cost),
      price: num(product.sellingPrice),
      stock: num(product.quantity),
      supplier: supplierNames.get(String(product.supplier)) ?? (product.supplier ? "Unknown supplier" : "No supplier"),
      createdAt: product.created_at,
    };
    if (product.barcode) byBarcode.set(String(product.barcode), entry);
    const existing = byName.get(entry.name);
    if (!existing) byName.set(entry.name, { ...entry, count: 1 });
    else {
      existing.cost = (existing.cost * existing.count + entry.cost) / (existing.count + 1);
      existing.stock += entry.stock;
      existing.count += 1;
    }
  }
  return {
    byName,
    byBarcode,
    lookup: (line) => (line.barcode && byBarcode.get(String(line.barcode))) || byName.get(normName(line.name)) || null,
  };
}

/** kind: "sale", "return" (a negative goods line) or "adjustment" (not goods, kept out of sales and GST). */
export function classifyLine(line, nonSale) {
  const name = normName(line.name);
  const amount = num(line.amount ?? num(line.price) * num(line.quantity));
  const quantity = Math.abs(num(line.quantity)) || 1;
  const kind = nonSale.some((re) => re.test(name)) ? "adjustment" : amount < 0 ? "return" : "sale";
  return { name, amount, quantity: amount < 0 ? -quantity : quantity, price: num(line.price), barcode: line.barcode, kind };
}

/** Flattens raw invoices into bills with classified, costed lines. */
export function prepareBills(invoices = [], { index, nonSalePatterns = DEFAULT_NON_SALE } = {}) {
  const nonSale = compilePatterns(nonSalePatterns);
  return invoices.map((invoice) => {
    const date = new Date(invoice.date);
    const lines = parseInvoiceLines(invoice.products).map((raw) => {
      const line = classifyLine(raw, nonSale);
      const product = line.kind === "adjustment" ? null : index?.lookup(line);
      const cost = product && product.cost > 0 ? product.cost * line.quantity : null;
      const listPrice = product?.price ?? 0;
      const discount = line.kind === "sale" && listPrice > line.price ? (listPrice - line.price) * line.quantity : 0;
      return { ...line, product, cost, discount };
    });
    const goods = lines.filter((line) => line.kind !== "adjustment");
    const customerName = String(invoice.customerName ?? "").trim();
    return {
      id: invoice.id,
      key: invoice.date,
      date,
      day: localISODate(date),
      month: localISODate(date).slice(0, 7),
      hour: date.getHours(),
      weekday: date.getDay(),
      customerName,
      customerPhone: invoice.customerNumber ?? "",
      customerKey: invoiceCustomerKey(invoice),
      walkIn: !customerName,
      total: num(invoice.total),
      cash: num(invoice.cash),
      upi: num(invoice.upi),
      credit: num(invoice.credit),
      lines,
      sales: goods.reduce((sum, line) => sum + line.amount, 0),
      returns: goods.filter((line) => line.kind === "return").reduce((sum, line) => sum + line.amount, 0),
      adjustments: lines.filter((line) => line.kind === "adjustment").reduce((sum, line) => sum + line.amount, 0),
      items: goods.reduce((sum, line) => sum + line.quantity, 0),
    };
  });
}
