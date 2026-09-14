import { LOW_STOCK_THRESHOLD } from "@/config/business";

const DAY_MS = 24 * 60 * 60 * 1000;

export const INVENTORY_VALUE_BANDS = {
  high: (value) => value > 10_000,
  medium: (value) => value > 5_000 && value <= 10_000,
  low: (value) => value <= 5_000,
};

export const PRODUCT_AGE_BANDS = {
  new: (age) => age <= 7 * DAY_MS,
  recent: (age) => age <= 30 * DAY_MS,
  old: (age) => age > 30 * DAY_MS,
};

export const SORT_FIELDS = [
  { value: "created_at", label: "Date Added" },
  { value: "name", label: "Name" },
  { value: "price", label: "Price" },
  { value: "inventory_value", label: "Inventory Value" },
];

export const DEFAULT_FILTERS = {
  sortField: "created_at",
  sortDirection: "desc",
  priceRange: { min: "", max: "" },
  inventoryValue: "all",
  productAge: "all",
};

const COMPARATORS = {
  created_at: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  name: (a, b) => String(a.name).localeCompare(String(b.name)),
  price: (a, b) => a.sellingPrice - b.sellingPrice,
  inventory_value: (a, b) => b.cost * b.quantity - a.cost * a.quantity,
};

function matchesSearch(product, term, supplierName) {
  if (!term) return true;
  const needle = term.toLowerCase();
  return [product.name, product.barcode, supplierName].some((field) =>
    String(field ?? "")
      .toLowerCase()
      .includes(needle)
  );
}

function withinPriceRange(product, { min, max }) {
  return (
    (!min || product.sellingPrice >= Number(min)) && (!max || product.sellingPrice <= Number(max))
  );
}

export function filterAndSortProducts({ products, search, supplierId, filters, supplierNameFor }) {
  const matched = products.filter((product) => {
    if (!matchesSearch(product, search, supplierNameFor(product.supplier))) return false;
    if (supplierId !== "all" && product.supplier !== supplierId) return false;
    if (!withinPriceRange(product, filters.priceRange)) return false;

    const valueBand = INVENTORY_VALUE_BANDS[filters.inventoryValue];
    if (valueBand && !valueBand(product.cost * product.quantity)) return false;

    const ageBand = PRODUCT_AGE_BANDS[filters.productAge];
    if (ageBand && !ageBand(Date.now() - new Date(product.created_at))) return false;

    return true;
  });

  const comparator = COMPARATORS[filters.sortField];
  if (!comparator) return matched;

  return [...matched].sort((a, b) => comparator(a, b) * (filters.sortDirection === "asc" ? 1 : -1));
}

export function computeInventoryAnalytics(products) {
  if (!products.length) return null;

  return products.reduce(
    (acc, product) => {
      acc.totalInventoryValue += product.cost * product.quantity;
      acc.totalRetailValue += product.sellingPrice * product.quantity;
      acc.totalItemsInStock += product.quantity;
      if (product.quantity === 0) acc.outOfStockItems += 1;
      else if (product.quantity <= LOW_STOCK_THRESHOLD) acc.lowStockItems += 1;
      return acc;
    },
    {
      totalInventoryValue: 0,
      totalRetailValue: 0,
      totalItemsInStock: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalUniqueProducts: products.length,
    }
  );
}
