import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, CloudOff, Eye, PenTool, Printer, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/PageLoader";
import { cn } from "@/lib/utils";
import { labelDesignService } from "@/services/labelDesignService";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { useProducts, useSuppliers } from "../../hooks/useInventory";
import { hasAttributesColumn } from "../../productAttributes";
import { printChecks } from "../analysis";
import { blankDesign, cloneDesign, newId } from "../designModel";
import { DotPreview } from "../DotPreview";
import { describeSize } from "../labelStock";
import { DPI_OPTIONS, printerSettings } from "../printerSettings";
import { useDeleteDesign, useLabelDesigns, useSaveDesigns } from "../useLabelDesigns";
import { useLabelPrinter } from "../useLabelPrinter";
import { SAMPLE_PRODUCT, createScope } from "../variables";
import { Board } from "./Board";
import { DesignMenu } from "./DesignMenu";
import { addElement, align, distribute, duplicateElements, moveTo, patchElements, removeElements, renameVariable, reorder } from "./designOps";
import { LabelPanel } from "./LabelPanel";
import { AddObjects, LayersPanel } from "./LayersPanel";
import { ObjectPanel, TEXT_INPUT_ID } from "./ObjectPanel";
import { useDesignHistory } from "./useDesignHistory";
import { VariablesPanel } from "./VariablesPanel";

const VIEW_KEY = "vh.designerView";
const VIEW_DEFAULTS = { background: "white", grid: true, snap: true };

function readView() {
  try {
    return { ...VIEW_DEFAULTS, ...JSON.parse(localStorage.getItem(VIEW_KEY)) };
  } catch {
    return VIEW_DEFAULTS;
  }
}

const isTyping = (target) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

function TopButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="press grid h-9 w-9 shrink-0 place-items-center rounded-xl text-indigo-foreground transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35 [&_svg]:h-4 [&_svg]:w-4"
    >
      {children}
    </button>
  );
}

function SaveStatus({ state, stored }) {
  if (state !== "saved") return <span className="text-[11px] font-semibold text-indigo-foreground">Saving…</span>;
  if (stored === "device" || stored === "offline") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-marigold" title={stored === "device" ? "Run docs/schema/sticker_designer.sql to keep designs in Supabase" : "Will sync when back online"}>
        <CloudOff className="h-3.5 w-3.5" /> {stored === "device" ? "Saved on this device" : "Saved offline"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-foreground">
      <Check className="h-3.5 w-3.5" /> Saved
    </span>
  );
}

function Editor({ initial, designs, stored }) {
  const navigate = useNavigate();
  const history = useDesignHistory(initial);
  const { design } = history;
  const saveDesigns = useSaveDesigns();
  const deleteDesign = useDeleteDesign();
  const { data: products } = useProducts();
  const { data: suppliers } = useSuppliers();
  const shop = useShopSettings();
  const { printLabels, printer } = useLabelPrinter();

  const [selectedIds, setSelectedIds] = useState([]);
  const [zoom, setZoom] = useState("fit");
  const [view, setView] = useState(readView);
  const [panel, setPanel] = useState("object");
  const [previewId, setPreviewId] = useState(null);
  const [mode, setMode] = useState("design");
  const [saveState, setSaveState] = useState("saved");
  const clipboard = useRef([]);

  const product = useMemo(() => products.find((candidate) => candidate.id === previewId) ?? SAMPLE_PRODUCT, [products, previewId]);
  const supplier = useMemo(() => suppliers.find((candidate) => String(candidate.id) === String(product.supplier)), [suppliers, product]);
  const scopeFor = useCallback(
    () => createScope({ design, product, supplier, settings: shop.settings, run: { copy: 1, copies: 1, index: 1, total: 1, designIndex: 1 } }),
    [design, product, supplier, shop.settings]
  );
  const scope = useMemo(scopeFor, [scopeFor]);
  const checkScope = useMemo(scopeFor, [scopeFor]);
  const checks = useMemo(() => (mode === "preview" ? printChecks(design, checkScope, printer.dpi) : []), [mode, design, checkScope, printer.dpi]);

  const updateView = (changes) =>
    setView((current) => {
      const next = { ...current, ...changes };
      try {
        localStorage.setItem(VIEW_KEY, JSON.stringify(next));
      } catch {
        // Only a screen preference.
      }
      return next;
    });

  const latest = useRef(design);
  latest.current = design;
  const savedRef = useRef(initial);

  useEffect(() => {
    if (history.isGesture || design === savedRef.current) return undefined;
    setSaveState("pending");
    const timer = setTimeout(() => {
      savedRef.current = design;
      saveDesigns.mutate([{ ...design, updated_at: new Date().toISOString() }], { onSettled: () => setSaveState("saved") });
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, history.isGesture]);

  const saveRef = useRef(saveDesigns.mutate);
  saveRef.current = saveDesigns.mutate;

  useEffect(() => {
    const unsaved = () => {
      if (latest.current === savedRef.current) return null;
      savedRef.current = latest.current;
      return { ...latest.current, updated_at: new Date().toISOString() };
    };
    const onUnload = () => {
      const design = unsaved();
      if (design) labelDesignService.save([design]);
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      const design = unsaved();
      if (design) saveRef.current([design]);
    };
  }, []);

  const { set } = history;
  const patch = useCallback((id, changes, coalesce) => set((current) => patchElements(current, { [id]: changes }), { coalesce }), [set]);
  const selectedRef = useRef(selectedIds);
  selectedRef.current = selectedIds;

  const select = useCallback((ids) => {
    setSelectedIds(ids);
    if (ids.length > 0) setPanel("object");
  }, []);

  const add = useCallback(
    (element, options) => {
      set((current) => addElement(current, element, options));
      select([element.id]);
    },
    [set, select]
  );

  const removeSelected = useCallback(() => {
    set((current) => removeElements(current, selectedRef.current));
    setSelectedIds([]);
  }, [set]);

  const duplicateSelected = useCallback(() => {
    const result = duplicateElements(latest.current, selectedRef.current);
    set(result.design);
    setSelectedIds(result.ids);
  }, [set]);

  const nudge = useCallback(
    (dx, dy) =>
      set(
        (current) =>
          patchElements(
            current,
            Object.fromEntries(
              current.elements
                .filter((element) => selectedRef.current.includes(element.id) && !element.locked)
                .map((element) => [element.id, { x: Math.round((element.x + dx) * 100) / 100, y: Math.round((element.y + dy) * 100) / 100 }])
            )
          ),
        { coalesce: "nudge" }
      ),
    [set]
  );

  useEffect(() => {
    const onKey = (event) => {
      if (isTyping(event.target) || mode !== "design") return;
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) history.redo();
        else history.undo();
      } else if (command && key === "y") {
        event.preventDefault();
        history.redo();
      } else if (command && key === "d") {
        event.preventDefault();
        duplicateSelected();
      } else if (command && key === "a") {
        event.preventDefault();
        setSelectedIds(latest.current.elements.filter((element) => !element.locked && !element.hidden).map(({ id }) => id));
      } else if (command && key === "c") {
        clipboard.current = latest.current.elements.filter((element) => selectedRef.current.includes(element.id));
      } else if (command && key === "v" && clipboard.current.length > 0) {
        event.preventDefault();
        const copies = clipboard.current.map((element) => ({ ...structuredClone(element), id: newId(), locked: false, x: element.x + 1, y: element.y + 1 }));
        clipboard.current = copies;
        set((current) => ({ ...current, elements: [...current.elements, ...copies] }));
        setSelectedIds(copies.map(({ id }) => id));
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedRef.current.length > 0) {
        event.preventDefault();
        removeSelected();
      } else if (event.key === "Escape") {
        setSelectedIds([]);
      } else if (event.key.startsWith("Arrow") && selectedRef.current.length > 0) {
        event.preventDefault();
        const step = event.shiftKey ? 1 : 0.1;
        nudge(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history, mode, set, duplicateSelected, removeSelected, nudge]);

  const saveOthers = (others) => others.length > 0 && saveDesigns.mutate(others.map((other) => ({ ...other, updated_at: new Date().toISOString() })));

  const makeDefault = () => {
    set((current) => ({ ...current, is_default: true }));
    saveOthers(designs.filter((other) => other.id !== design.id && other.is_default).map((other) => ({ ...other, is_default: false })));
  };

  const toggleSupplier = (supplierId) => {
    const on = !design.default_for.includes(supplierId);
    set((current) => ({ ...current, default_for: on ? [...current.default_for, supplierId] : current.default_for.filter((id) => id !== supplierId) }));
    if (on) {
      saveOthers(
        designs
          .filter((other) => other.id !== design.id && other.default_for.map(String).includes(supplierId))
          .map((other) => ({ ...other, default_for: other.default_for.filter((id) => String(id) !== supplierId) }))
      );
    }
  };

  const openDesign = (id) => navigate(`/inventory/stickers/designer/${id}`);
  const createDesign = (next) => {
    saveDesigns.mutate([next]);
    openDesign(next.id);
  };

  const removeDesign = () => {
    if (!window.confirm(`Delete the design "${design.name}"? This cannot be undone.`)) return;
    const rest = designs.filter((other) => other.id !== design.id);
    const nextDefault = design.is_default ? rest[0] : rest.find((other) => other.is_default) ?? rest[0];
    savedRef.current = latest.current;
    deleteDesign.mutate(design.id);
    if (design.is_default && nextDefault) saveOthers([{ ...nextDefault, is_default: true }]);
    openDesign(nextDefault.id);
  };

  const editText = (id) => {
    select([id]);
    setPanel("object");
    requestAnimationFrame(() => document.getElementById(TEXT_INPUT_ID)?.focus());
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1.5 bg-indigo px-2 py-2 text-white sm:px-3">
        <Link to="/inventory?tab=stickers" aria-label="Back to stickers" className="press grid h-9 w-9 shrink-0 place-items-center rounded-xl text-indigo-foreground hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <input
          value={design.name}
          aria-label="Design name"
          onChange={(event) => set((current) => ({ ...current, name: event.target.value }), { coalesce: "name" })}
          onBlur={(event) => !event.target.value.trim() && set((current) => ({ ...current, name: "Untitled" }))}
          className="h-9 w-40 min-w-0 flex-1 rounded-xl bg-transparent px-2 font-display text-lg font-extrabold tracking-tight outline-none transition-colors hover:bg-white/5 focus-visible:bg-white/10 focus-visible:ring-0 sm:max-w-[16rem]"
        />
        {design.is_default && <span className="shrink-0 rounded-full bg-marigold px-2 py-0.5 text-[10px] font-extrabold text-marigold-foreground">DEFAULT</span>}
        <DesignMenu
          design={design}
          designs={designs}
          onOpen={openDesign}
          onNew={() => createDesign({ ...blankDesign(), size: design.size })}
          onDuplicate={() => createDesign(cloneDesign(design, { name: `${design.name} copy` }))}
          onMakeDefault={makeDefault}
          onDelete={removeDesign}
        />
        <span className="hidden text-xs font-semibold text-indigo-foreground xl:inline">{describeSize(design.size)}</span>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
          <TopButton label="Undo (Ctrl+Z)" onClick={history.undo} disabled={!history.canUndo}>
            <Undo2 />
          </TopButton>
          <TopButton label="Redo (Ctrl+Shift+Z)" onClick={history.redo} disabled={!history.canRedo}>
            <Redo2 />
          </TopButton>
          <span className="mx-1 hidden sm:inline">
            <SaveStatus state={saveState} stored={stored} />
          </span>
          <div role="radiogroup" aria-label="View" className="flex rounded-xl bg-white/10 p-0.5">
            {[
              ["design", "Design", PenTool],
              ["preview", "Print view", Eye],
            ].map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-colors", mode === value ? "bg-white text-indigo" : "text-indigo-foreground hover:text-white")}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <Button
            variant="marigold"
            size="sm"
            className="h-9 rounded-xl font-bold"
            onClick={() => printLabels([{ design, product, scope: scopeFor() }])}
            title="Print this sticker once, for the preview product"
          >
            <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Print one</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[250px_minmax(0,1fr)_340px] lg:overflow-hidden">
        <main
          className="relative order-1 h-[54dvh] shrink-0 border-b border-border lg:order-2 lg:h-auto lg:min-h-0 lg:border-b-0"
          style={{ background: "radial-gradient(circle at 1px 1px, hsl(var(--input)) 1px, transparent 1.4px) 0 0 / 18px 18px, hsl(var(--secondary) / .55)" }}
        >
          {mode === "design" ? (
            <Board
              design={design}
              scope={scope}
              selectedIds={selectedIds}
              onSelect={select}
              onChange={(changes, options) => set((current) => patchElements(current, changes), options)}
              onGestureEnd={history.commit}
              zoom={zoom}
              onZoom={setZoom}
              background={view.background}
              showGrid={view.grid}
              snap={view.snap}
              onEditText={editText}
            />
          ) : (
            <div className="h-full overflow-y-auto px-4 py-6 sm:px-8">
              <div className="mx-auto mb-4 flex max-w-[720px] flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-extrabold">What the printer will print</h2>
                  <p className="text-xs text-muted-foreground">Black or nothing, one square per printer dot. Red and amber outlines need a look.</p>
                </div>
                <div role="radiogroup" aria-label="Printer resolution" className="flex rounded-xl border border-border bg-surface p-0.5">
                  {DPI_OPTIONS.map((dpi) => (
                    <button
                      key={dpi}
                      type="button"
                      role="radio"
                      aria-checked={printer.dpi === dpi}
                      onClick={() => printerSettings.set({ dpi })}
                      className={cn("h-8 rounded-lg px-3 text-xs font-bold", printer.dpi === dpi ? "bg-indigo text-white" : "text-muted-foreground")}
                    >
                      {dpi} dpi
                    </button>
                  ))}
                </div>
              </div>
              <DotPreview design={design} scope={checkScope} dpi={printer.dpi} checks={checks} />
            </div>
          )}
        </main>

        <aside className="order-2 border-b border-border bg-surface lg:order-1 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <AddObjects design={design} onAdd={add} />
          <LayersPanel
            design={design}
            selectedIds={selectedIds}
            onSelect={select}
            onPatch={(id, changes) => patch(id, changes)}
            onReorder={(direction) => set((current) => reorder(current, selectedIds, direction))}
            onMoveTo={(id, index) => set((current) => moveTo(current, id, index))}
            onDuplicate={duplicateSelected}
            onDelete={removeSelected}
          />
        </aside>

        <aside className="order-3 bg-surface lg:overflow-y-auto lg:border-l lg:border-border">
          <Tabs value={panel} onValueChange={setPanel}>
            <div className="sticky top-0 z-10 border-b border-border bg-surface px-3 py-2">
              <TabsList className="grid h-10 w-full grid-cols-3">
                <TabsTrigger value="object">Object</TabsTrigger>
                <TabsTrigger value="label">Label</TabsTrigger>
                <TabsTrigger value="values">Values</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="object" className="mt-0">
              <ObjectPanel
                design={design}
                selectedIds={selectedIds}
                scope={scope}
                settings={shop.settings}
                onPatch={patch}
                onAlign={(edge) => set((current) => align(current, selectedIds, edge))}
                onDistribute={(axis) => set((current) => distribute(current, selectedIds, axis))}
              />
            </TabsContent>
            <TabsContent value="label" className="mt-0">
              <LabelPanel
                design={design}
                onSize={(size) => set((current) => ({ ...current, size }), { coalesce: "size" })}
                suppliers={suppliers}
                onToggleSupplier={toggleSupplier}
                isDefault={design.is_default}
                onMakeDefault={makeDefault}
                view={view}
                onView={updateView}
              />
            </TabsContent>
            <TabsContent value="values" className="mt-0">
              <VariablesPanel
                design={design}
                scope={scope}
                products={products}
                product={product}
                onPickProduct={(picked) => setPreviewId(picked?.id ?? null)}
                settings={shop.settings}
                onSaveSettings={shop.save}
                settingsStored={shop.stored}
                attributesAvailable={hasAttributesColumn(products)}
                onVariables={(variables) => set((current) => ({ ...current, variables }), { coalesce: "variables" })}
                onRenameVariable={(from, to) => set((current) => renameVariable(current, from, to))}
              />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}

/** Full-screen sticker designer for one saved design (the shop default when no id is given). */
export default function DesignerPage() {
  const { designId } = useParams();
  const { designs, defaultDesign, stored, isLoading } = useLabelDesigns();
  const design = designId ? designs.find((candidate) => candidate.id === designId) : null;

  if (!designId && defaultDesign) return <Navigate to={`/inventory/stickers/designer/${defaultDesign.id}`} replace />;
  if (!design) {
    if (isLoading) return <PageLoader label="Loading designs…" />;
    return defaultDesign ? <Navigate to={`/inventory/stickers/designer/${defaultDesign.id}`} replace /> : <PageLoader />;
  }
  return <Editor key={design.id} initial={design} designs={designs} stored={stored} />;
}
