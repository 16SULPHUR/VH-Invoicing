import { useCallback, useMemo } from "react";
import { useShopSettings } from "@/features/settings/useShopSettings";

export const DEFAULT_EXPENSE_CATEGORIES = ["Rent", "Salary", "Electricity", "Tea & snacks", "Transport", "Packing", "Repairs", "Other"];

export const BOOKS_DEFAULTS = {
  bank_name: "Bank",
  default_source: "Cash",
  expense_categories: DEFAULT_EXPENSE_CATEGORIES,
  require_customer: true,
  walk_in_name: "Walk-in",
  home_label: "Home",
  shop_label: "Shop",
  holdings_require_author: false,
  holdings_allow_negative: false,
  shop_cash_limit: 0,
};

/** Books options live under one `books` key of the shared shop settings. */
export function useBooksSettings() {
  const { settings, save, isSaving, stored } = useShopSettings();
  const stash = settings.books;

  const books = useMemo(() => {
    const merged = { ...BOOKS_DEFAULTS, ...stash };
    if (!Array.isArray(merged.expense_categories) || merged.expense_categories.length === 0) {
      merged.expense_categories = DEFAULT_EXPENSE_CATEGORIES;
    }
    return merged;
  }, [stash]);

  const update = useCallback((changes) => save({ books: { ...books, ...changes } }), [books, save]);

  return { books, update, isSaving, stored };
}

export const placeLabels = (books) => ({ home: books.home_label, shop: books.shop_label });
