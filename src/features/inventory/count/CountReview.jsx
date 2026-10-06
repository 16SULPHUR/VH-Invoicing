import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLoader } from "@/components/common/PageLoader";
import { useToast } from "@/hooks/use-toast";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { Chips } from "@/features/counter/components/Chips";
import { useSaveTool } from "@/features/counter/hooks/useShopTools";
import { useProducts } from "../hooks/useInventory";
import { reviewRows } from "./countMath";

const PAGE = 150;

const FILTERS = [
  { value: "different", label: "Counted, different" },
  { value: "missing", label: "Not found" },
  { value: "outside", label: "Outside this count" },
  { value: "negative", label: "Negative in system" },
  { value: "match", label: "Matching" },
];

const matches = (row, filter) => (filter === "negative" ? row.negative : row.kind === filter);

function Delta({ value }) {
  if (value === 0) return <span className="text-muted-foreground">±0</span>;
  return <span className={value > 0 ? "font-bold text-leaf" : "font-bold text-destructive"}>{value > 0 ? `+${value}` : value}</span>;
}

/** What the count found against the system, with a tick for each change to apply. */
export function CountReview({ count, scans, supplierName, onBack, onDone }) {
  const { toast } = useToast();
  const products = useProducts();
  const save = useSaveTool("stock_counts");
  const applied = count.status !== "counting";
  const [filter, setFilter] = useState("different");
  const [ticks, setTicks] = useState(null);
  const [limit, setLimit] = useState(PAGE);
  const { refetch } = products;

  useEffect(() => {
    if (!applied) refetch();
  }, [applied, refetch]);

  const review = useMemo(() => reviewRows(count, products.data, scans), [count, products.data, scans]);
  const chosen = useMemo(() => ticks ?? new Set(review.rows.filter((row) => row.apply).map((row) => row.id)), [ticks, review.rows]);
  const toggle = (id, on) => {
    const next = new Set(chosen);
    if (on) next.add(id);
    else next.delete(id);
    setTicks(next);
  };

  const counts = Object.fromEntries(FILTERS.map(({ value }) => [value, review.rows.filter((row) => matches(row, value)).length]));
  const shown = review.rows.filter((row) => matches(row, filter));
  const changes = review.rows.filter((row) => chosen.has(row.id) && row.delta !== 0);

  const apply = async () => {
    if (!window.confirm(`Set the stock of ${changes.length} product${changes.length === 1 ? "" : "s"} to what was counted?`)) return;
    const fresh = (await refetch()).data ?? products.data;
    const current = new Map(fresh.map((product) => [String(product.id), Number(product.quantity) || 0]));
    const result = changes.map((row) => ({
      product_id: row.id,
      name: row.product.name,
      barcode: row.product.barcode ?? null,
      from: current.get(row.id) ?? row.system,
      to: row.counted,
    }));
    save.mutate(
      {
        record: count,
        row: { status: "applied", applied_at: new Date().toISOString(), result },
        moves: result.map((item) => ({ product_id: item.product_id, name: item.name, delta: item.to - item.from })),
        reason: "count",
      },
      {
        onSuccess: () => {
          toast({ title: `Stock updated for ${result.length} products`, description: `Logged under ${count.token}.` });
          onDone();
        },
      }
    );
  };

  const close = () => {
    if (!window.confirm("Close this count without changing any stock?")) return;
    save.mutate({ record: count, row: { status: "closed" } }, { onSuccess: onDone });
  };

  const header = (
    <div className="space-y-1">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {applied ? "All counts" : "Back to scanning"}
      </Button>
      <h2 className="truncate font-display text-xl font-extrabold">
        {count.token} · {count.scope === "supplier" ? supplierName ?? "Supplier" : count.scope === "negative" ? "Negative stock" : "Whole shop"}
      </h2>
    </div>
  );

  if (applied) {
    const result = count.result ?? [];
    return (
      <div className="space-y-4">
        {header}
        <p className="text-sm text-muted-foreground">
          {count.status === "applied"
            ? `Applied ${formatDateDDMMMYYYY(count.applied_at)}: ${result.length} product${result.length === 1 ? "" : "s"} changed.`
            : "Closed without changing stock."}
        </p>
        {result.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {result.map((item) => (
              <li key={item.product_id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {item.name} <span className="text-xs text-muted-foreground">{item.barcode}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {item.from} → <b className="text-foreground">{item.to}</b>
                </span>
                <span className="w-10 text-right tabular-nums">
                  <Delta value={item.to - item.from} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (products.isLoading) return <PageLoader label="Loading stock…" />;

  return (
    <div className="space-y-4 pb-24">
      {header}
      <Chips
        label="Show"
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setLimit(PAGE);
        }}
        options={FILTERS.map((item) => ({ ...item, count: counts[item.value], alert: item.value === "negative" }))}
      />
      {filter === "missing" && count.scope === "all" && (
        <p className="rounded-xl bg-marigold/15 px-3 py-2 text-sm">
          Only tick pieces you are sure are gone. In a whole-shop count, anything not scanned would be set to 0.
        </p>
      )}
      {filter === "outside" && <p className="rounded-xl bg-secondary px-3 py-2 text-sm">These were scanned but are not part of this count. Tick them to use the count anyway.</p>}

      {shown.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Nothing in this list.</p>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setTicks(new Set([...chosen, ...shown.map((row) => row.id)]))}>
              Tick all {shown.length}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTicks(new Set([...chosen].filter((id) => !shown.some((row) => row.id === id))))}>
              Untick all
            </Button>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {shown.slice(0, limit).map((row) => (
              <li key={row.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <Checkbox checked={chosen.has(row.id)} disabled={row.delta === 0} onCheckedChange={(value) => toggle(row.id, value === true)} aria-label={`Apply ${row.product.name}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{row.product.name}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">{row.product.barcode ?? "No code"}</span>
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    <span className={row.system < 0 ? "text-destructive" : "text-muted-foreground"}>{row.system}</span> →{" "}
                    <b>{row.counted}</b>
                  </span>
                  <span className="w-10 text-right text-sm tabular-nums">
                    <Delta value={row.delta} />
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {shown.length > limit && (
            <Button variant="outline" className="w-full" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, shown.length - limit)} more
            </Button>
          )}
        </>
      )}

      {review.unknown.length > 0 && (
        <section className="space-y-1.5">
          <p className="eyebrow">Codes not in the product list</p>
          <div className="flex flex-wrap gap-1.5">
            {review.unknown.map((item) => (
              <span key={item.code} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold tabular-nums text-destructive">
                {item.code} ×{item.quantity}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Add these as products and they count here.</p>
        </section>
      )}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
        <Button variant="ghost" onClick={close} disabled={save.isPending} className="mr-auto px-2">
          Close without applying
        </Button>
        <Button className="press block-shadow" disabled={changes.length === 0 || save.isPending} onClick={apply}>
          <Check className="h-4 w-4" aria-hidden /> Apply {changes.length} change{changes.length === 1 ? "" : "s"}
        </Button>
      </div>
    </div>
  );
}
