import { FileSearch, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { TableSkeleton } from "@/components/common/Skeletons";

function Pagination({ page, totalPages, setPage }) {
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between border-t border-border px-3 py-2.5 text-sm text-muted-foreground"
    >
      <span className="tabular-nums">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="press h-8 rounded-xl border-[1.5px] border-border bg-surface px-3 font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="press h-8 rounded-xl border-[1.5px] border-border bg-surface px-3 font-semibold text-foreground hover:bg-secondary disabled:opacity-40"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export function ReportTable({
  title,
  table,
  columns,
  searchPlaceholder = "Search",
  rowKey = (row, index) => row.id ?? index,
  footerRows = null,
  emptyMessage = "Nothing to show.",
}) {
  const { rows, isLoading, error, search, setSearch, page, totalPages, setPage, sort } = table;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        title={title}
        actions={
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-9"
            />
          </div>
        }
      />

      {isLoading && <TableSkeleton columns={columns.length} />}

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error.message}
        </p>
      )}

      {!isLoading && !error && rows.length === 0 && !footerRows && (
        <EmptyState icon={FileSearch} title="No results" description={emptyMessage} />
      )}

      {!isLoading && !error && (rows.length > 0 || footerRows) && (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_hsl(var(--indigo)/0.05)]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-elevated hover:bg-surface-elevated">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      aria-sort={
                        sort.key === column.key
                          ? sort.asc
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => table.toggleSort(column.key, column.sortType)}
                          className="press inline-flex items-center gap-1 uppercase hover:text-foreground"
                        >
                          {column.header}
                          <span aria-hidden className="text-rani">
                            {sort.key === column.key ? (sort.asc ? "▲" : "▼") : ""}
                          </span>
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={rowKey(row, index)}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="tabular-nums">
                        {column.render ? column.render(row) : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {footerRows}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      )}
    </div>
  );
}
