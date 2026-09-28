import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import { downloadCsv, toCsv } from "@/utils/csv";
import { percent } from "../lib/format";

export function Panel({ title, eyebrow, actions, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_hsl(var(--indigo)/0.05)] ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-end justify-between gap-2 px-4 pt-4">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2 className="font-display text-lg font-bold leading-tight tracking-tight">{title}</h2>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Up is good unless `invert` (returns, credit given). */
export function Delta({ value, invert = false, label }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
        good ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
      }`}
      title={label}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {percent(Math.abs(value))}
      {label && <span className="sr-only"> {label}</span>}
    </span>
  );
}

export function Kpi({ label, value, delta, invert, hint, tone = "plain" }) {
  const hero = tone === "hero";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 ${
        hero ? "motif-overlay border-indigo bg-indigo text-white" : "border-border/70 bg-surface"
      }`}
    >
      <p className={`eyebrow ${hero ? "text-indigo-foreground" : ""}`}>{label}</p>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
        <p className="font-display text-[1.75rem] font-bold leading-none tracking-tight tabular-nums">{value}</p>
        {delta != null && (
          <span className={hero ? "rounded-full bg-white/95" : ""}>
            <Delta value={delta} invert={invert} label="vs previous period" />
          </span>
        )}
      </div>
      {hint && <p className={`mt-1.5 text-xs ${hero ? "text-indigo-foreground" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}

export function CsvButton({ filename, headers, rows, label = "CSV" }) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, toCsv(headers, rows))}
      className="press inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-surface px-3 text-xs font-bold hover:border-indigo/40"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

export function Pills({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-8 gap-0.5 rounded-full border border-border bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`press rounded-full px-3 text-xs font-bold transition-colors ${
            value === option.value ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Sortable table for already-computed rows. Columns: { key, header, render?, value?, align?, csv? }.
 * `value` gives the sort and CSV value when `render` formats it.
 */
export function DataTable({ columns, rows, initialSort, limit = 15, rowKey = (row, i) => row.id ?? i, csvName, onRowClick, empty = "Nothing in this period." }) {
  const [sort, setSort] = useState(initialSort ?? { key: null, asc: false });
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const get = column?.value ?? ((row) => row[sort.key]);
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const cmp = typeof x === "number" || typeof y === "number" || x instanceof Date ? (Number(x ?? -Infinity) || 0) - (Number(y ?? -Infinity) || 0) : String(x ?? "").localeCompare(String(y ?? ""));
      return sort.asc ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const visible = showAll ? sorted : sorted.slice(0, limit);
  const csvValue = (column, row) => (column.csv ? column.csv(row) : column.value ? column.value(row) : row[column.key]);

  if (rows.length === 0) return <p className="rounded-xl bg-muted/60 px-3 py-6 text-center text-sm text-muted-foreground">{empty}</p>;

  return (
    <div>
      {csvName && (
        <div className="-mt-1 mb-2 flex justify-end">
          <CsvButton
            filename={csvName}
            headers={columns.map((c) => c.header)}
            rows={sorted.map((row) => columns.map((c) => {
              const v = csvValue(c, row);
              return v instanceof Date ? v.toISOString().slice(0, 10) : v;
            }))}
          />
        </div>
      )}
      <div className="-mx-4 overflow-x-auto">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-elevated text-left">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground ${column.align === "right" ? "text-right" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setSort((s) => ({ key: column.key, asc: s.key === column.key ? !s.asc : false }))}
                    className="press inline-flex items-center gap-1 uppercase hover:text-foreground"
                  >
                    {column.header}
                    <span aria-hidden className="text-rani">{sort.key === column.key ? (sort.asc ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-border/60 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-accent/60" : ""}`}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-2 tabular-nums ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > limit && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="press mt-3 text-sm font-bold text-rani hover:underline">
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
      {error.message}
    </p>
  );
}

export function Meter({ value, className = "bg-rani" }) {
  const width = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-muted align-middle" aria-hidden>
      <span className={`block h-full rounded-full ${className}`} style={{ width: `${width}%` }} />
    </span>
  );
}
