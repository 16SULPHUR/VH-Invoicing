import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { printChecks } from "./analysis";
import { LabelFace } from "./LabelRenderer";
import { describeSize, perSheet } from "./labelStock";
import { buildRun, runPrompts } from "./printRun";
import { designFor } from "./useLabelDesigns";
import { createScope } from "./variables";

function SheetStart({ size, startAt, onChange }) {
  const slots = perSheet(size);
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">
        Half-used sheet? Tap the first free label.
        <span className="ml-1 font-normal text-muted-foreground">Starts at label {startAt + 1} of {slots}.</span>
      </p>
      <div
        className="mx-auto grid w-full max-w-[16rem] gap-[3px] rounded-lg border border-border bg-secondary/50 p-1.5"
        style={{ gridTemplateColumns: `repeat(${size.columns}, minmax(0, 1fr))`, aspectRatio: "210 / 297" }}
        role="radiogroup"
        aria-label="First free label on the sheet"
      >
        {Array.from({ length: slots }, (_, slot) => (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={slot === startAt}
            aria-label={`Start at label ${slot + 1}`}
            onClick={() => onChange(slot)}
            className={cn(
              "rounded-[2px] transition-colors",
              slot < startAt ? "bg-muted-foreground/25" : slot === startAt ? "bg-rani" : "bg-surface hover:bg-rani/30"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Before printing: questions asked once for the run, the first free label on a sheet, and a
 * flip-through of every sticker with its real values.
 */
export function RunDialog({ open, onOpenChange, rows, designs, override, suppliers, settings, dpi, onPrint }) {
  const used = useMemo(() => [...new Map(rows.map(({ product }) => designFor(product, designs, override)).filter(Boolean).map((design) => [design.id, design])).values()], [rows, designs, override]);
  const prompts = useMemo(() => runPrompts(used), [used]);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [startAt, setStartAt] = useState(0);

  const labels = useMemo(
    () => (open ? buildRun({ rows, designs, override, suppliers, settings, prompts: answers }) : []),
    [open, rows, designs, override, suppliers, settings, answers]
  );
  const current = labels[Math.min(index, labels.length - 1)];
  const sheet = used.find((design) => design.size.stock === "sheet");
  const sizes = [...new Set(used.map((design) => describeSize(design.size)))];

  const warnings = useMemo(() => {
    if (!current) return [];
    const supplier = suppliers.find((candidate) => String(candidate.id) === String(current.product.supplier));
    const fresh = createScope({ design: current.design, product: current.product, supplier, settings, prompts: answers });
    return printChecks(current.design, fresh, dpi).filter((check) => check.level !== "info");
  }, [current, suppliers, settings, answers, dpi]);

  useEffect(() => {
    if (!open) return undefined;
    setIndex((value) => Math.min(value, Math.max(0, labels.length - 1)));
    const onKey = (event) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (event.key === "ArrowRight") setIndex((value) => Math.min(labels.length - 1, value + 1));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, labels.length]);

  const width = current?.design.size.width ?? 50.8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">
            {labels.length} sticker{labels.length === 1 ? "" : "s"} to print
          </DialogTitle>
          <DialogDescription>Flip through every sticker with its real values before it goes to the printer.</DialogDescription>
        </DialogHeader>

        {prompts.length > 0 && (
          <section className="grid gap-3 rounded-2xl bg-marigold/15 p-3 sm:grid-cols-2">
            <p className="text-sm font-bold sm:col-span-2">Asked once for this run</p>
            {prompts.map((prompt) => (
              <div key={prompt.name} className="grid gap-1.5">
                <Label htmlFor={`prompt-${prompt.name}`} className="text-xs font-semibold text-muted-foreground">
                  {prompt.label || prompt.name}
                </Label>
                <Input
                  id={`prompt-${prompt.name}`}
                  value={answers[prompt.name] ?? prompt.default ?? ""}
                  placeholder={prompt.default ? String(prompt.default) : "Leave empty to skip"}
                  onChange={(event) => setAnswers((previous) => ({ ...previous, [prompt.name]: event.target.value }))}
                />
              </div>
            ))}
          </section>
        )}

        {current && (
          <section className="space-y-3">
            <div className="grid place-items-center overflow-hidden rounded-2xl bg-[#f1e9d8] px-3 py-6">
              <div className="shadow-[0_1px_4px_rgba(0,0,0,.25)]" style={{ borderRadius: `${current.design.size.radius ?? 0}mm` }}>
                <LabelFace design={current.design} scope={current.scope} mode="preview" unit={`min(${(560 / width).toFixed(2)}px, ${(78 / width).toFixed(3)}vw)`} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" aria-label="Previous sticker" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                <ChevronLeft />
              </Button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-sm font-bold">{current.product.name}</p>
                <p className="truncate text-xs tabular-nums text-muted-foreground">
                  Sticker {Math.min(index, labels.length - 1) + 1} of {labels.length} · copy {current.scope.get("copy")} of {current.scope.get("copies")} · {current.design.name}
                </p>
              </div>
              <Button variant="outline" size="icon" aria-label="Next sticker" disabled={index >= labels.length - 1} onClick={() => setIndex(index + 1)}>
                <ChevronRight />
              </Button>
            </div>
            {labels.length > 2 && (
              <input
                type="range"
                min={0}
                max={labels.length - 1}
                value={Math.min(index, labels.length - 1)}
                onChange={(event) => setIndex(Number(event.target.value))}
                aria-label="Jump to sticker"
                className="w-full accent-[hsl(var(--rani))]"
              />
            )}
            {warnings.length > 0 && (
              <ul className="space-y-1 rounded-xl bg-marigold/10 px-3 py-2 text-xs text-warning">
                {warnings.slice(0, 4).map((warning, i) => (
                  <li key={i} className="flex gap-1.5">
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                      {warning.id && <b>{warning.name}: </b>}
                      {warning.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {sizes.length > 1 && (
          <p className="rounded-xl bg-secondary px-3 py-2 text-xs">
            This run uses different label sizes ({sizes.join(", ")}). Each prints at its own page size; load the right stock or print them separately.
          </p>
        )}

        {sheet && <SheetStart size={sheet.size} startAt={Math.min(startAt, perSheet(sheet.size) - 1)} onChange={setStartAt} />}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="h-12 rounded-2xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="rani"
            className="block-shadow h-12 flex-1 rounded-2xl font-display text-base font-extrabold"
            disabled={labels.length === 0}
            onClick={() => onPrint(labels, { startAt: sheet ? Math.min(startAt, perSheet(sheet.size) - 1) : 0 })}
          >
            <Printer className="mr-1 h-4 w-4" /> Print {labels.length} sticker{labels.length === 1 ? "" : "s"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
