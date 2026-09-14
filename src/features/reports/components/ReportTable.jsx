import { FileSearch } from "lucide-react";
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
      className="flex items-center justify-between border-t border-border px-3 py-2 text-sm text-muted-foreground"
    >
      <span className="tabular-nums">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className="press rounded-md border border-border px-3 py-1 hover:bg-surface-elevated disabled:opacity-40"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="press rounded-md border border-border px-3 py-1 hover:bg-surface-elevated disabled:opacity-40"
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
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-9 w-full sm:w-72"
          />
        }
      />

      {isLoading && <TableSkeleton columns={columns.length} />}

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error.message}
        </p>
      )}

      {!isLoading && !error && rows.length === 0 && !footerRows && (
        <EmptyState icon={FileSearch} title="No results" description={emptyMessage} />
      )}

      {!isLoading && !error && (rows.length > 0 || footerRows) && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
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
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => table.toggleSort(column.key, column.sortType)}
                          className="press inline-flex items-center gap-1 hover:text-foreground"
                        >
                          {column.header}
                          <span aria-hidden>
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
