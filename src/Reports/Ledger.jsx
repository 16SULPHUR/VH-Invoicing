import React, { useEffect, useMemo, useState } from "react";
import { getLedger } from "../api/accounting";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDDMMMYYYY, formatINR } from "../utils/formatters";

const PAGE_SIZE = 25;

const Ledger = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getLedger();
        if (isMounted) setRows(data);
      } catch (e) {
        setError(e.message || "Failed to load ledger");
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
          [r.account_name, r.description, r.reference_table, String(r.reference_id || "")]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        )
      : rows;
    const sorted = [...base].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortKey === "date") return (new Date(a.date) - new Date(b.date)) * dir;
      if (sortKey === "account_name") return String(a.account_name || "").localeCompare(String(b.account_name || "")) * dir;
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
      setSortAsc(key !== "date");
    }
  };

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => {
        acc.debit += Number(r.debit) || 0;
        acc.credit += Number(r.credit) || 0;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [filtered]);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-pink-400">Ledger</h2>
        <div className="w-full md:w-96">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search account, description, reference..."
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
                <TableHead className="text-pink-400">Transaction ID</TableHead>
                <TableHead className="text-pink-400 cursor-pointer" onClick={() => toggleSort("account_name")}>
                  Account
                </TableHead>
                <TableHead className="text-pink-400">Description</TableHead>
                <TableHead className="text-pink-400">Debit</TableHead>
                <TableHead className="text-pink-400">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((r, idx) => (
                <TableRow key={`${r.transaction_id}-${idx}`} className="text-white">
                  <TableCell>{formatDateDDMMMYYYY(r.date)}</TableCell>
                  <TableCell>#{r.transaction_id}</TableCell>
                  <TableCell>{r.account_name}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>{r.debit ? formatINR(r.debit) : ""}</TableCell>
                  <TableCell>{r.credit ? formatINR(r.credit) : ""}</TableCell>
                </TableRow>
              ))}
              <TableRow className="text-white font-semibold">
                <TableCell colSpan={4} className="text-right">Total</TableCell>
                <TableCell>{formatINR(totals.debit)}</TableCell>
                <TableCell>{formatINR(totals.credit)}</TableCell>
              </TableRow>
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

export default Ledger;


