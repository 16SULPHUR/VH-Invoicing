import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

function Pagination({ page, totalPages, setPage }) {
  return (
    <div className="flex items-center justify-between px-2 py-3 text-sm text-gray-300">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded border border-gray-700 px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <button
          type="button"
          className="rounded border border-gray-700 px-3 py-1 disabled:opacity-50"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/**
 * `columns` entries are { key, header, render?, sortType?, sortable? }.
 * `footerRows` are pre-built <TableRow> elements appended after the data.
 */
export function ReportTable({
  title,
  table,
  columns,
  searchPlaceholder = "Search...",
  rowKey = (row, index) => row.id ?? index,
  footerRows = null,
  actions = null,
  emptyMessage = "Nothing to show.",
}) {
  const { rows, isLoading, error, search, setSearch, page, totalPages, setPage, sort } = table;

  return (
    <div className="p-4 text-gray-100 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-pink-400">{title}</h2>
        <div className="flex w-full gap-2 md:w-96">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
          />
          {actions}
        </div>
      </div>

      {isLoading && <div>Loading…</div>}
      {error && <div className="text-red-400">{error.message}</div>}

      {!isLoading && !error && (
        <div className="rounded-md bg-[#09090b]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`text-pink-400 ${column.sortable ? "cursor-pointer" : ""}`}
                    onClick={
                      column.sortable
                        ? () => table.toggleSort(column.key, column.sortType)
                        : undefined
                    }
                  >
                    {column.header}
                    {sort.key === column.key && (sort.asc ? " ▲" : " ▼")}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !footerRows && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-gray-400">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => (
                <TableRow key={rowKey(row, index)} className="text-white">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {footerRows}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      )}
    </div>
  );
}
