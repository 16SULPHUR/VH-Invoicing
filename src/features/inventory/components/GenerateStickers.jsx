import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crosshair, Eye, Minus, PenTool, Plus, Printer, ScanLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupees } from "@/utils/formatters";
import { swatchFor } from "@/utils/swatch";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { useProducts, useSuppliers } from "../hooks/useInventory";
import { LabelFace } from "../stickers/LabelRenderer";
import { PrinterDialog } from "../stickers/PrinterDialog";
import { RunDialog } from "../stickers/RunDialog";
import { describeSize } from "../stickers/labelStock";
import { advanceCounters, buildRun, runPrompts } from "../stickers/printRun";
import { stickerQueue, useStickerQueue } from "../stickers/stickerQueue";
import { designFor, useLabelDesigns, useSaveDesigns } from "../stickers/useLabelDesigns";
import { useLabelPrinter } from "../stickers/useLabelPrinter";
import { SAMPLE_PRODUCT, createScope } from "../stickers/variables";

const EACH = "each";

const isToday = (date) => date && new Date(date).toDateString() === new Date().toDateString();
const stockCount = (product) => Math.max(1, Number(product.quantity) || 1);
const toQueue = (products) => products.map((product) => ({ id: product.id, count: stockCount(product) }));

function Chip({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press h-8 rounded-full border-[1.5px] border-border bg-surface px-3 text-xs font-bold transition-colors hover:border-indigo/40 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ProductSearch({ products, onPick }) {
  const [term, setTerm] = useState("");
  const needle = term.trim().toLowerCase();
  const matches = needle
    ? products
        .filter((product) =>
          [product.name, product.barcode].some((field) => String(field ?? "").toLowerCase().includes(needle))
        )
        .slice(0, 6)
    : [];

  const pick = (product) => {
    onPick(product);
    setTerm("");
  };

  return (
    <div className="relative">
      <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        id="sticker-search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || matches.length === 0) return;
          event.preventDefault();
          pick(matches.find((product) => String(product.barcode) === term.trim()) ?? matches[0]);
        }}
        placeholder="Search a product or scan its code…"
        className="pl-9"
        autoComplete="off"
      />
      {matches.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
          {matches.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => pick(product)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm hover:bg-secondary"
              >
                <span className="truncate font-semibold">{product.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {product.barcode} · {formatRupees(product.sellingPrice)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** A print queue of QR stickers, one per piece in stock unless changed, each printed with its design. */
export default function GenerateStickers() {
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();
  const { queue, design: override } = useStickerQueue();
  const { designs } = useLabelDesigns();
  const saveDesigns = useSaveDesigns();
  const { settings } = useShopSettings();
  const { printLabels, printTest, printer } = useLabelPrinter();
  const [runOpen, setRunOpen] = useState(false);
  const [printerOpen, setPrinterOpen] = useState(false);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const rows = useMemo(
    () => queue.map((item) => ({ ...item, product: byId.get(item.id) })).filter((row) => row.product),
    [queue, byId]
  );
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const addedToday = products.filter((product) => isToday(product.created_at));
  const batchDesign = designs.some((design) => design.id === override) ? override : "";

  const usage = useMemo(() => {
    const counts = new Map();
    rows.forEach(({ product, count }) => {
      const design = designFor(product, designs, batchDesign);
      if (design) counts.set(design.id, { design, count: (counts.get(design.id)?.count ?? 0) + count });
    });
    return [...counts.values()];
  }, [rows, designs, batchDesign]);
  const needsQuestions = usage.some(({ design }) => design.size.stock === "sheet") || runPrompts(usage.map(({ design }) => design)).length > 0;

  const previewProduct = rows[0]?.product ?? SAMPLE_PRODUCT;
  const previewDesign = designFor(previewProduct, designs, batchDesign);
  const previewScope = useMemo(
    () =>
      previewDesign &&
      createScope({
        design: previewDesign,
        product: previewProduct,
        supplier: suppliers.find((supplier) => String(supplier.id) === String(previewProduct.supplier)),
        settings,
      }),
    [previewDesign, previewProduct, suppliers, settings]
  );

  const run = async (labels, options) => {
    const opened = await printLabels(labels, options);
    if (!opened) return;
    setRunOpen(false);
    const advanced = advanceCounters(labels);
    if (advanced.length > 0) saveDesigns.mutate(advanced);
  };

  const print = () => {
    if (needsQuestions) {
      setRunOpen(true);
      return;
    }
    run(buildRun({ rows, designs, override: batchDesign, suppliers, settings }));
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&>*]:min-w-0">
      <section className="space-y-3 rounded-3xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))] sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Print queue</h2>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold tabular-nums text-muted-foreground">
            {rows.length} product{rows.length === 1 ? "" : "s"} · {total} sticker{total === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Chip onClick={() => stickerQueue.add(toQueue(addedToday))} disabled={addedToday.length === 0}>
            Added today · {addedToday.length}
          </Chip>
          <Select
            value=""
            onValueChange={(supplierId) =>
              stickerQueue.add(toQueue(products.filter((product) => product.supplier === supplierId)))
            }
          >
            <SelectTrigger className="h-8 w-auto gap-1 rounded-full border-[1.5px] px-3 text-xs font-bold">
              <SelectValue placeholder="Whole supplier…" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ProductSearch products={products} onPick={(product) => stickerQueue.add(toQueue([product]))} />

        {rows.length === 0 ? (
          <p className="rounded-2xl border-[1.5px] border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing queued. Search or scan a product, or add everything from today or from one supplier.
            You can also select products on the Products tab.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map(({ id, count, product }) => (
              <li key={id} className="flex items-center gap-3 rounded-2xl bg-secondary/60 py-2 pl-2 pr-2.5">
                <span
                  className="swatch h-9 w-9 shrink-0 rounded-xl after:opacity-50"
                  style={{ backgroundColor: swatchFor(product.name) }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{product.name}</div>
                  <div className="truncate text-xs tabular-nums text-muted-foreground">
                    {product.barcode} · {formatRupees(product.sellingPrice)} · stock {product.quantity ?? 0}
                    {usage.length > 1 && ` · ${designFor(product, designs, batchDesign)?.name ?? ""}`}
                  </div>
                </div>
                <div className="flex h-9 shrink-0 items-center rounded-xl border-[1.5px] border-border bg-surface">
                  <button
                    type="button"
                    aria-label={`One fewer sticker for ${product.name}`}
                    onClick={() => stickerQueue.setCount(id, count - 1)}
                    className="press grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    inputMode="numeric"
                    aria-label={`Stickers for ${product.name}`}
                    value={count}
                    onChange={(event) => stickerQueue.setCount(id, event.target.value.replace(/\D/g, ""))}
                    className="w-9 bg-transparent text-center text-sm font-extrabold tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`One more sticker for ${product.name}`}
                    onClick={() => stickerQueue.setCount(id, count + 1)}
                    className="press grid h-full w-8 place-items-center text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${product.name}`}
                  onClick={() => stickerQueue.remove(id)}
                  className="press grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="press h-12 rounded-2xl" onClick={stickerQueue.clear} disabled={rows.length === 0}>
            Clear
          </Button>
          <Button
            variant="rani"
            className="block-shadow h-12 flex-1 rounded-2xl font-display text-base font-extrabold"
            onClick={print}
            disabled={total === 0}
          >
            <Printer className="mr-2 h-4 w-4" /> Print {total} sticker{total === 1 ? "" : "s"}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-indigo p-4 text-white sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold tracking-tight">Sticker</h2>
          <Link
            to={`/inventory/stickers/designer/${previewDesign?.id ?? ""}`}
            className="press flex h-8 items-center gap-1.5 rounded-full bg-marigold px-3 text-xs font-extrabold text-marigold-foreground"
          >
            <PenTool className="h-3.5 w-3.5" /> Design stickers
          </Link>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="sticker-design" className="text-xs font-semibold text-indigo-foreground">
            Design for this batch
          </label>
          <Select value={batchDesign || EACH} onValueChange={(value) => stickerQueue.setDesign(value === EACH ? "" : value)}>
            <SelectTrigger id="sticker-design" className="h-10 border-white/15 bg-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EACH}>Each product&apos;s own design</SelectItem>
              {designs.map((design) => (
                <SelectItem key={design.id} value={design.id}>
                  {design.name}
                  {design.is_default ? " (default)" : ""} · {describeSize(design.size)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid place-items-center overflow-hidden rounded-2xl bg-[#f1e9d8] py-6">
          {previewDesign && previewScope && (
            <div className="shadow-[0_1px_4px_rgba(0,0,0,.25)] [zoom:1.9] max-sm:[zoom:1.45]" style={{ borderRadius: `${previewDesign.size.radius ?? 0}mm` }}>
              <LabelFace design={previewDesign} scope={previewScope} mode="preview" />
            </div>
          )}
        </div>
        {usage.length > 1 && (
          <ul className="flex flex-wrap gap-1.5 text-xs font-bold">
            {usage.map(({ design, count }) => (
              <li key={design.id} className="rounded-full bg-white/10 px-3 py-1">
                {design.name} · {count}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="h-10 rounded-xl bg-white/10 text-white hover:bg-white/15 hover:text-white" onClick={() => setRunOpen(true)} disabled={total === 0}>
            <Eye className="h-4 w-4" /> Preview all {total}
          </Button>
          <Button variant="ghost" className="h-10 rounded-xl text-indigo-foreground hover:bg-white/10 hover:text-white" onClick={() => setPrinterOpen(true)}>
            <Crosshair className="h-4 w-4" /> Printer alignment
            {(printer.x !== 0 || printer.y !== 0) && <span className="tabular-nums text-marigold">({printer.x}, {printer.y})</span>}
          </Button>
        </div>
        <p className="text-sm leading-relaxed text-indigo-foreground">
          Roll stickers print one per page at the label size, black only. Set the label printer&apos;s paper size to match, with no margins.
        </p>
      </section>

      <RunDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        rows={rows}
        designs={designs}
        override={batchDesign}
        suppliers={suppliers}
        settings={settings}
        dpi={printer.dpi}
        onPrint={run}
      />
      <PrinterDialog
        open={printerOpen}
        onOpenChange={setPrinterOpen}
        printer={printer}
        onTestPrint={() => printTest((previewDesign ?? designs[0]).size)}
      />
    </div>
  );
}
