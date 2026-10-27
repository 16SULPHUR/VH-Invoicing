import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileDown, Hourglass, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { StatTile } from "@/components/common/StatTile";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { queryKeys } from "@/lib/queryClient";
import { shopToolsService } from "@/services/shopToolsService";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatDateDDMMMYYYY, toISODate } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { Chips } from "@/features/counter/components/Chips";
import { useProducts, useSuppliers } from "../hooks/useInventory";
import { stickerQueue } from "../stickers/stickerQueue";
import { useLabelDesigns } from "../stickers/useLabelDesigns";
import { groupBySupplier, lastSoldIndex, oldStockRows } from "./oldStock";

const WINDOWS = [90, 180, 365].map((days) => ({ value: days, label: `${days} days` }));
const BASES = [
  { value: "sale", label: "Not sold in" },
  { value: "added", label: "Added more than" },
];
const LONGEST = 365;

function useLastSold(products) {
  const [since] = useState(() => new Date(Date.now() - LONGEST * 86_400_000).toISOString().slice(0, 10));
  const query = useQuery({
    queryKey: queryKeys.shopTools.lastSold(since),
    queryFn: () => shopToolsService.soldSince(since),
    staleTime: 10 * 60_000,
  });
  useQueryErrorToast(query.error, "Couldn't load bills");
  const index = useMemo(() => lastSoldIndex(query.data ?? [], products), [query.data, products]);
  return { index, isLoading: query.isLoading };
}

/** Stock that has not moved, by supplier and value at cost, ready to re-tag for a sale. */
export default function OldStockTab() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const products = useProducts();
  const suppliers = useSuppliers();
  const { designs } = useLabelDesigns();
  const sold = useLastSold(products.data);
  const [days, setDays] = useState(180);
  const [basis, setBasis] = useState("sale");
  const [selected, setSelected] = useState(() => new Set());
  const [useSaleDesign, setUseSaleDesign] = useState(true);

  const rows = useMemo(() => oldStockRows(products.data, sold.index, { days, basis }), [products.data, sold.index, days, basis]);
  const groups = useMemo(() => groupBySupplier(rows, suppliers.data), [rows, suppliers.data]);
  const saleDesign = designs.find((design) => /\bsale\b/i.test(design.name));
  const totals = rows.reduce((sum, row) => ({ pieces: sum.pieces + row.quantity, value: sum.value + row.value }), { pieces: 0, value: 0 });
  const picked = rows.filter((row) => selected.has(row.id));
  const stickers = picked.reduce((sum, row) => sum + row.quantity, 0);

  const toggle = (ids, on) =>
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const sendToStickers = () => {
    stickerQueue.add(picked.map((row) => ({ id: row.product.id, count: row.quantity })));
    if (saleDesign && useSaleDesign) stickerQueue.setDesign(saleDesign.id);
    toast({ title: `${picked.length} products queued`, description: `${stickers} sale stickers are waiting on the Stickers tab.` });
    setSelected(new Set());
    navigate("/inventory?tab=stickers");
  };

  const exportCsv = () =>
    downloadCsv(
      `old_stock_${days}d_${toISODate()}.csv`,
      toCsv(
        ["Supplier", "Product", "Code", "Pieces", "Cost", "Value at cost", "Last sold", "Added"],
        groups.flatMap((group) =>
          group.rows.map((row) => [
            group.name,
            row.product.name,
            row.product.barcode ?? "",
            row.quantity,
            row.cost,
            row.value,
            row.lastSold ? formatDateDDMMMYYYY(row.lastSold) : `Not in last ${LONGEST} days`,
            row.added ? formatDateDDMMMYYYY(row.added) : "",
          ])
        )
      )
    );

  if (products.isLoading || sold.isLoading) return <PageLoader label="Reading a year of bills…" />;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Chips label="Measure" value={basis} onChange={setBasis} options={BASES} />
        <span className="hidden h-5 w-px bg-border sm:block" aria-hidden />
        <Chips label="Days" value={days} onChange={setDays} options={WINDOWS} />
        <Button variant="outline" className="press ml-auto" onClick={exportCsv} disabled={rows.length === 0}>
          <FileDown className="h-4 w-4" aria-hidden /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="motif-overlay col-span-2 rounded-2xl bg-marigold px-4 py-3.5 text-marigold-foreground sm:col-span-1">
          <p className="eyebrow relative text-marigold-foreground/75">Old stock at cost</p>
          <p className="relative mt-1.5 font-display text-3xl font-extrabold tabular-nums leading-none tracking-tight">{formatRupees(totals.value)}</p>
        </div>
        <StatTile label="Pieces" value={totals.pieces} />
        <StatTile label="Products" value={rows.length} hint={`${groups.length} suppliers`} />
      </div>

      <p className="text-xs text-muted-foreground">
        {basis === "sale"
          ? `In stock, added over ${days} days ago and not on any bill in the last ${days} days. Sales are matched by code, else by name.`
          : `In stock and added over ${days} days ago, whether or not they sold since.`}
      </p>

      {rows.length === 0 ? (
        <EmptyState icon={Hourglass} title="Nothing this old" description="Every piece in stock has sold or arrived recently." />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const ids = group.rows.map((row) => row.id);
            const all = ids.every((id) => selected.has(id));
            return (
              <section key={group.key} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <label className="flex cursor-pointer items-center gap-3 bg-surface-elevated px-3 py-2.5">
                  <Checkbox checked={all} onCheckedChange={(value) => toggle(ids, value === true)} aria-label={`Select all from ${group.name}`} />
                  <span className="min-w-0 flex-1 truncate font-display text-base font-bold">{group.name}</span>
                  <span className="shrink-0 text-right text-xs text-muted-foreground">
                    {group.pieces} pcs · <b className="text-sm text-foreground">{formatRupees(group.value)}</b>
                  </span>
                </label>
                <ul className="divide-y divide-border">
                  {group.rows.map((row) => (
                    <li key={row.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                        <Checkbox checked={selected.has(row.id)} onCheckedChange={(value) => toggle([row.id], value === true)} aria-label={`Select ${row.product.name}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{row.product.name}</span>
                          <span className="block truncate text-xs tabular-nums text-muted-foreground">
                            {row.product.barcode ?? "No code"} · {row.lastSold ? `sold ${formatDateDDMMMYYYY(row.lastSold)}` : "no sale in a year"}
                            {row.ageDays !== null && ` · in stock ${row.ageDays} days`}
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-sm tabular-nums">
                          <span className="block font-semibold">{row.cost ? formatRupees(row.value) : "—"}</span>
                          <span className="block text-xs text-muted-foreground">{row.quantity} pcs</span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {picked.length > 0 && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
          <p className="min-w-0 flex-1 text-sm">
            <b className="tabular-nums">{picked.length}</b> products · {stickers} stickers
          </p>
          {saleDesign && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={useSaleDesign} onCheckedChange={(value) => setUseSaleDesign(value === true)} />
              Use &quot;{saleDesign.name}&quot; design
            </label>
          )}
          <Button className="press block-shadow" onClick={sendToStickers}>
            <Tag className="h-4 w-4" aria-hidden /> Print sale tags
          </Button>
        </div>
      )}
    </div>
  );
}
