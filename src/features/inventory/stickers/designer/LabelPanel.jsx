import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ROLL_PRESETS, SHEET_PRESETS, perSheet, withPreset } from "../labelStock";
import { NumberField, Section, Segmented, SelectField } from "./fields";

/** Label stock, size and where this design is used. */
export function LabelPanel({ design, onSize, suppliers, onToggleSupplier, isDefault, onMakeDefault, view, onView }) {
  const { size } = design;
  const presets = size.stock === "sheet" ? SHEET_PRESETS : ROLL_PRESETS;
  const set = (changes) => onSize({ ...size, ...changes, preset: "custom" });

  return (
    <div>
      <Section title="Label stock">
        <Segmented
          value={size.stock}
          onChange={(stock) => onSize(withPreset(size, stock === "sheet" ? SHEET_PRESETS[0].id : ROLL_PRESETS[0].id))}
          options={[
            { value: "roll", label: "Roll" },
            { value: "sheet", label: "A4 sheet" },
          ]}
        />
        <SelectField
          label="Size"
          value={presets.some(({ id }) => id === size.preset) ? size.preset : "custom"}
          onChange={(preset) => preset !== "custom" && onSize(withPreset(size, preset))}
          options={[...presets.map(({ id, label }) => ({ value: id, label })), { value: "custom", label: "Custom size" }]}
        />
        <div className="grid grid-cols-3 gap-1.5">
          <NumberField label="Width" suffix="mm" step={0.1} min={5} max={size.stock === "sheet" ? 200 : 120} value={size.width} onChange={(width) => set({ width })} />
          <NumberField label="Height" suffix="mm" step={0.1} min={5} max={size.stock === "sheet" ? 290 : 200} value={size.height} onChange={(height) => set({ height })} />
          <NumberField label="Corners" suffix="mm" step={0.5} min={0} value={size.radius ?? 0} onChange={(radius) => onSize({ ...size, radius })} />
        </div>
        {size.stock === "roll" ? (
          <div className="grid grid-cols-3 gap-1.5">
            <NumberField label="Gap" suffix="mm" step={0.5} min={0} value={size.gap ?? 0} onChange={(gap) => onSize({ ...size, gap })} />
            <p className="col-span-2 self-end pb-1 text-[11px] leading-snug text-muted-foreground">
              Set the same size and gap in the TSC driver. Each sticker prints as its own page.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <NumberField label="Across" step={1} min={1} max={10} value={size.columns} onChange={(columns) => set({ columns: Math.round(columns) })} />
              <NumberField label="Down" step={1} min={1} max={30} value={size.rows} onChange={(rows) => set({ rows: Math.round(rows) })} />
              <p className="self-end pb-1 text-[11px] font-bold text-muted-foreground">{perSheet(size)} per sheet</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <NumberField label="Top" suffix="mm" value={size.top} min={0} onChange={(top) => set({ top })} />
              <NumberField label="Left" suffix="mm" value={size.left} min={0} onChange={(left) => set({ left })} />
              <NumberField label="Gap →" suffix="mm" value={size.gapX} min={0} onChange={(gapX) => set({ gapX })} />
              <NumberField label="Gap ↓" suffix="mm" value={size.gapY} min={0} onChange={(gapY) => set({ gapY })} />
            </div>
          </>
        )}
      </Section>

      <Section title="On screen">
        <Segmented
          label="Behind the label"
          value={view.background}
          onChange={(background) => onView({ background })}
          options={[
            { value: "white", label: "White label" },
            { value: "clear", label: "Clear tag" },
          ]}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold">
          <label className="flex items-center gap-2">
            <Switch checked={view.grid} onCheckedChange={(grid) => onView({ grid })} /> Grid
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={view.snap} onCheckedChange={(snap) => onView({ snap })} /> Snap guides
          </label>
        </div>
      </Section>

      <Section title="Used for">
        <label className="flex items-center justify-between gap-3 text-[13px] font-semibold">
          <span>
            Shop default
            <span className="block text-[11px] font-normal text-muted-foreground">Products with no supplier design print with this.</span>
          </span>
          <Switch checked={isDefault} disabled={isDefault} onCheckedChange={onMakeDefault} />
        </label>
        {suppliers.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-muted-foreground">Default for these suppliers</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suppliers.map((supplier) => {
                const on = design.default_for.map(String).includes(String(supplier.id));
                return (
                  <button
                    key={supplier.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleSupplier(String(supplier.id))}
                    className={cn(
                      "press h-7 rounded-full border-[1.5px] px-2.5 text-[12px] font-bold transition-colors",
                      on ? "border-indigo bg-indigo text-white" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {supplier.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
