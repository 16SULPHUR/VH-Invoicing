import React, { useEffect, useMemo, useState } from "react";
import { getTrialBalance } from "../api/accounting";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "../utils/formatters";

const PAGE_SIZE = 50;

const TrialBalance = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getTrialBalance();
        if (isMounted) setRows(data);
      } catch (e) {
        setError(e.message || "Failed to load trial balance");
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
    const base = q ? rows.filter((r) => r.account.toLowerCase().includes(q)) : rows;
    const sorted = [...base].sort((a, b) =>
      (sortAsc ? 1 : -1) * String(a.account).localeCompare(String(b.account))
    );
    return sorted;
  }, [rows, search, sortAsc]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-sky-400">Trial Balance</h2>
        <div className="flex gap-2 w-full md:w-[520px]">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search account..."
          />
          <button
            className="px-3 py-1 rounded border border-gray-700"
            onClick={() => setSortAsc((s) => !s)}
          >
            Sort {sortAsc ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-[#09090b] rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-sky-400">Account</TableHead>
                <TableHead className="text-sky-400">Total Debit</TableHead>
                <TableHead className="text-sky-400">Total Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((r) => (
                <TableRow key={r.account} className="text-white">
                  <TableCell>{r.account}</TableCell>
                  <TableCell>{formatINR(r.debit)}</TableCell>
                  <TableCell>{formatINR(r.credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="text-white font-semibold">
                <TableCell className="text-right">Total</TableCell>
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

export default TrialBalance;


