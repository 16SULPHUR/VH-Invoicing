import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

const DEFAULT_PAGE_SIZE = 25;

function compare(a, b, key, type) {
  if (type === "date") return new Date(a[key]) - new Date(b[key]);
  if (type === "number") return (Number(a[key]) || 0) - (Number(b[key]) || 0);
  return String(a[key] ?? "").localeCompare(String(b[key] ?? ""));
}

/**
 * Fetch + search + sort + paginate, shared by every accounting report.
 * `searchFields` are the row keys a free-text query is matched against.
 */
export function useReportTable({
  queryKey,
  queryFn,
  searchFields = [],
  initialSort,
  pageSize = DEFAULT_PAGE_SIZE,
  select,
}) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn, select });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort ?? { key: null, type: "string", asc: true });

  const rows = useMemo(() => data ?? [], [data]);
  const searchKey = searchFields.join(",");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const fields = searchKey ? searchKey.split(",") : [];
    const matched = needle
      ? rows.filter((row) =>
          fields.some((field) =>
            String(row[field] ?? "")
              .toLowerCase()
              .includes(needle)
          )
        )
      : rows;

    if (!sort.key) return matched;
    return [...matched].sort((a, b) => compare(a, b, sort.key, sort.type) * (sort.asc ? 1 : -1));
  }, [rows, search, sort, searchKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key, type = "string") =>
    setSort((previous) =>
      previous.key === key
        ? { ...previous, asc: !previous.asc }
        : { key, type, asc: type === "string" }
    );

  return {
    rows: pageRows,
    allRows: filtered,
    isLoading,
    error,
    search,
    setSearch: (value) => {
      setSearch(value);
      setPage(1);
    },
    page: safePage,
    totalPages,
    setPage,
    sort,
    toggleSort,
  };
}
