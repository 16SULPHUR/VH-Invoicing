import React, { useEffect, useMemo, useState } from "react";
import { getTransactions } from "../api/accounting";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDDMMMYYYY } from "../utils/formatters";

const PAGE_SIZE = 25;

const Transactions = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getTransactions();
        if (isMounted) setRows(data);
      } catch (e) {
        setError(e.message || "Failed to load transactions");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? rows.filter((r) =>
          [r.description, r.reference_table, String(r.reference_id || "")]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        )
      : rows;
    const sorted = [...base].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "date") {
        return (new Date(a.date) - new Date(b.date)) * dir;
      }
      if (sortKey === "description") {
        return String(a.description || "").localeCompare(String(b.description || "")) * dir;
      }
      if (sortKey === "id") {
        return ((a.id || 0) - (b.id || 0)) * dir;
      }
      return 0;
    });
    return sorted;
  }, [rows, search, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "description");
    }
  };

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-pink-400">Transactions</h2>
        <div className="w-full md:w-72">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search description or ref..."
          />
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-[#09090b] rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-pink-400 cursor-pointer" onClick={() => toggleSort("date")}>Date</TableHead>
                <TableHead className="text-pink-400 cursor-pointer" onClick={() => toggleSort("id")}>Transaction ID</TableHead>
                <TableHead className="text-pink-400 cursor-pointer" onClick={() => toggleSort("description")}>Description</TableHead>
                <TableHead className="text-pink-400">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((r) => (
                <TableRow key={r.id} className="text-white">
                  <TableCell>{formatDateDDMMMYYYY(r.date)}</TableCell>
                  <TableCell>#{r.id}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>
                    {r.reference_table || ""} {r.reference_id ? `#${r.reference_id}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between py-3 px-2 text-sm text-gray-300">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded border border-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <button
                className="px-3 py-1 rounded border border-gray-700 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;


