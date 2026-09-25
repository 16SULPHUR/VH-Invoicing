import { useMemo, useState } from "react";
import { ArrowLeft, ClipboardCheck, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/common/StatTile";
import { LiveScanner } from "@/features/counter/components/ScanSheet";
import { useBeep } from "@/features/counter/hooks/useBeep";
import { findByCode, normalizeCode } from "@/features/counter/lib/shopTools";
import { useCountScans } from "./useCountScans";
import { CountReview } from "./CountReview";
import { inScope } from "./countMath";

/** Scan tags (camera, USB scanner or typing) with running counts, then review and apply. */
export function CountSession({ count, products, suppliers, onBack }) {
  const counting = count.status === "counting";
  const { scans, add, remove } = useCountScans(count.id, counting);
  const [phase, setPhase] = useState("scan");
  const [code, setCode] = useState("");
  const beep = useBeep();

  const byId = useMemo(() => new Map(products.map((product) => [String(product.id), product])), [products]);
  const supplierName = suppliers.find((supplier) => String(supplier.id) === String(count.supplier))?.name;

  const rows = useMemo(() => {
    const map = new Map();
    for (const scan of scans) {
      const key = scan.product_id ? `p:${scan.product_id}` : `c:${scan.code}`;
      const entry = map.get(key) ?? { key, product: scan.product_id ? byId.get(String(scan.product_id)) : null, code: scan.code, counted: 0, scans: [] };
      entry.counted += Number(scan.quantity) || 0;
      entry.scans.push(scan);
      map.set(key, entry);
    }
    return [...map.values()];
  }, [scans, byId]);

  const pieces = scans.reduce((sum, scan) => sum + (Number(scan.quantity) || 0), 0);
  const unknown = rows.filter((row) => !row.product).length;

  const record = (raw) => {
    const clean = normalizeCode(raw);
    if (!clean) return null;
    const product = findByCode(products, clean);
    add({ code: clean, product_id: product ? String(product.id) : null });
    if (!product) return { ok: false, message: `${clean} is not in the product list. Kept as an unknown code.` };
    const already = rows.find((row) => row.product?.id === product.id)?.counted ?? 0;
    const outside = !inScope(count, product);
    return {
      ok: true,
      message: `${product.name}: ${already + 1} counted · system ${Number(product.quantity) || 0}${outside ? " · outside this count" : ""}`,
    };
  };

  if (phase === "review" || !counting) {
    return <CountReview count={count} scans={scans} supplierName={supplierName} onBack={counting ? () => setPhase("scan") : onBack} onDone={onBack} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4" aria-hidden /> All counts
        </Button>
        <h2 className="order-last min-w-0 basis-full truncate font-display text-xl font-extrabold sm:order-none sm:flex-1 sm:basis-auto">
          {count.token} · {count.scope === "supplier" ? supplierName ?? "Supplier" : count.scope === "negative" ? "Negative stock" : "Whole shop"}
        </h2>
        <Button className="press block-shadow ml-auto" onClick={() => setPhase("review")} disabled={scans.length === 0 && count.scope === "all"}>
          <ClipboardCheck className="h-4 w-4" aria-hidden /> Review
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Pieces" value={pieces} className="px-3 py-2.5" />
        <StatTile label="Products" value={rows.length - unknown} className="px-3 py-2.5" />
        <StatTile label="Unknown" value={unknown} accent={unknown ? "text-destructive" : "text-foreground"} className="px-3 py-2.5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <LiveScanner onCode={record} autoStart={false} />
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const result = record(code);
              if (result?.ok) beep();
              setCode("");
            }}
          >
            <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Type a code or use a USB scanner" inputMode="numeric" autoComplete="off" aria-label="Product code" />
            <Button type="submit" variant="outline" disabled={!code.trim()}>
              Add
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Pieces with the same code: take one tag out of view before scanning the next. Several phones can count at
            once; their scans show up here every few seconds. Keep pieces held for bookings or out on approval aside:
            they are already out of system stock.
          </p>
        </div>

        <section className="space-y-2">
          <p className="eyebrow">Counted so far</p>
          {rows.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Scan the first tag to start.</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {rows.map((row) => {
                const system = Number(row.product?.quantity) || 0;
                const outside = row.product && !inScope(count, row.product);
                return (
                  <li key={row.key} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${row.product ? "" : "text-destructive"}`}>{row.product?.name ?? `Unknown code ${row.code}`}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {row.product ? `${row.code} · system ${system}` : "Not in the product list"}
                        {outside && " · outside this count"}
                      </p>
                    </div>
                    <span
                      className={`w-9 text-right font-display text-lg font-extrabold tabular-nums ${
                        row.product && row.counted !== system ? "text-warning" : ""
                      }`}
                    >
                      {row.counted}
                    </span>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => remove(row.scans[0].id)}
                        className="press grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
                        aria-label={`Undo one scan of ${row.product?.name ?? row.code}`}
                      >
                        {row.counted === 1 ? <X className="h-4 w-4" aria-hidden /> : <Minus className="h-4 w-4" aria-hidden />}
                      </button>
                      {row.product && (
                        <button
                          type="button"
                          onClick={() => add({ code: row.code, product_id: String(row.product.id) })}
                          className="press grid h-8 w-8 place-items-center rounded-full hover:bg-secondary"
                          aria-label={`One more ${row.product.name}`}
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
