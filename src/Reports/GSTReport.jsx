import React, { useEffect, useMemo, useState } from "react";
import { getGSTOutput } from "../api/accounting";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateDDMMMYYYY, formatINR } from "../utils/formatters";

const PAGE_SIZE = 25;

const GSTReport = () => {
  const [rows, setRows] = useState([]);
  const [totalGST, setTotalGST] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const { transactions, totalGST } = await getGSTOutput();
        if (isMounted) {
          setRows(transactions || []);
          setTotalGST(totalGST || 0);
        }
      } catch (e) {
        setError(e.message || "Failed to load GST Output");
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
    return q
      ? rows.filter((r) =>
          [r.description, r.reference_table, String(r.reference_id || "")]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))
        )
      : rows;
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const subtotal = useMemo(() => {
    return current.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  }, [current]);

  return (
    <div className="p-4 md:p-6 text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-sky-400">GST Output</h2>
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
                <TableHead className="text-sky-400">Date</TableHead>
                <TableHead className="text-sky-400">Transaction ID</TableHead>
                <TableHead className="text-sky-400">Description</TableHead>
                <TableHead className="text-sky-400">Reference</TableHead>
                <TableHead className="text-sky-400">GST (Credit)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((r, idx) => (
                <TableRow key={`${r.transaction_id}-${idx}`} className="text-white">
                  <TableCell>{formatDateDDMMMYYYY(r.date)}</TableCell>
                  <TableCell>#{r.transaction_id}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell>
                    {r.reference_table || ""} {r.reference_id ? `#${r.reference_id}` : ""}
                  </TableCell>
                  <TableCell>{formatINR(r.credit)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="text-white font-semibold">
                <TableCell colSpan={4} className="text-right">Subtotal (page)</TableCell>
                <TableCell>{formatINR(subtotal)}</TableCell>
              </TableRow>
              <TableRow className="text-white font-semibold">
                <TableCell colSpan={4} className="text-right">Total GST</TableCell>
                <TableCell>{formatINR(totalGST)}</TableCell>
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

export default GSTReport;


