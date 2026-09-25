import { useMemo, useState } from "react";
import {
  DEFAULT_FILTERS,
  computeInventoryAnalytics,
  filterAndSortProducts,
} from "../productFilters";

export function useProductFilters({ products, suppliers }) {
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("all");
  const [stockLevel, setStockLevel] = useState("all");
  // Draft filters live in the panel; they only take effect on "Apply".
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const supplierNameFor = useMemo(() => {
    const byId = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    return (id) => byId.get(id);
  }, [suppliers]);

  const visibleProducts = useMemo(
    () =>
      filterAndSortProducts({
        products,
        search,
        supplierId,
        stockLevel,
        filters: appliedFilters,
        supplierNameFor,
      }),
    [products, search, supplierId, stockLevel, appliedFilters, supplierNameFor]
  );

  const analytics = useMemo(() => computeInventoryAnalytics(products), [products]);

  return {
    search,
    setSearch,
    supplierId,
    setSupplierId,
    stockLevel,
    setStockLevel,
    draftFilters,
    setDraftFilters,
    applyFilters: () => setAppliedFilters({ ...draftFilters }),
    visibleProducts,
    analytics,
    supplierNameFor,
  };
}

export function useProductSelection(visibleProducts) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggle = (id) =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked) =>
    setSelectedIds(checked ? new Set(visibleProducts.map((product) => product.id)) : new Set());

  return {
    selectedIds,
    toggle,
    toggleAll,
    clear: () => setSelectedIds(new Set()),
    allSelected: visibleProducts.length > 0 && selectedIds.size === visibleProducts.length,
  };
}
