import { useRef, useState } from "react";
import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  ChevronDown,
  FoldVertical,
  Upload,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SYMBOLOGIES } from "../barcode";
import { renderTemplate } from "../expr";
import { LABEL_FONTS, fontById, fontStack } from "../fonts";
import { readImageFile } from "../images";
import { CONDITION_OPS, conditionHolds, variableGroups } from "../variables";
import { FieldLabel, IconButton, NumberField, Section, Segmented, SelectField, TextField } from "./fields";

export const TEXT_INPUT_ID = "designer-text-input";

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900].map((value) => ({ value: String(value), label: { 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Extra bold", 900: "Black" }[value] }));

function FontPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = fontById(value);
  return (
    <div className="min-w-0">
      <FieldLabel>Font</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="mt-0.5 flex h-8 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-border bg-surface-elevated px-2 text-left text-[13px]"
          >
            <span className="truncate" style={{ fontFamily: fontStack(current.id) }}>
              {current.label}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 rounded-2xl p-1.5">
          <ul role="listbox" aria-label="Font">
            {LABEL_FONTS.map((font) => (
              <li key={font.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={font.id === current.id}
                  onClick={() => {
                    onChange(font.id);
                    setOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-secondary", font.id === current.id && "bg-secondary")}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-elevated text-lg" style={{ fontFamily: fontStack(font.id), fontWeight: 700 }}>
                    {font.sample}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]" style={{ fontFamily: fontStack(font.id) }}>
                      {font.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground" style={{ fontFamily: fontStack(font.id) }}>
                      CHAKRA ₹900 · साड़ी · સાડી
                    </span>
                  </span>
                  {font.id === current.id && <Check className="h-4 w-4 text-rani" />}
                </button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Template input with an "insert value" menu that drops {name} at the cursor. */
function TemplateField({ id, label, value, onChange, groups, multiline, hint }) {
  const ref = useRef(null);
  const insert = (name) => {
    if (!name) return;
    const input = ref.current;
    const at = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? at;
    const next = `${value.slice(0, at)}{${name}}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      input?.focus();
      const caret = at + name.length + 2;
      input?.setSelectionRange(caret, caret);
    });
  };
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <div className="flex items-end justify-between gap-2">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <select
          aria-label="Insert a value"
          value=""
          onChange={(event) => insert(event.target.value)}
          className="h-6 max-w-[9rem] rounded-md bg-secondary px-1.5 text-[11px] font-bold text-indigo"
        >
          <option value="">+ Insert value</option>
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.label} {`{${item.name}}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <Tag
        id={id}
        ref={ref}
        value={value}
        rows={multiline ? 3 : undefined}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full resize-y rounded-lg border-[1.5px] border-border bg-surface-elevated px-2 py-1.5 font-mono text-[12px] leading-snug focus-visible:border-rani/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20 focus-visible:ring-offset-0"
      />
      {hint}
    </div>
  );
}

function ConditionEditor({ element, onPatch, groups, scope }) {
  const condition = element.condition;
  const op = CONDITION_OPS.find(({ value }) => value === condition?.op);
  const set = (changes) => onPatch({ condition: { ...(condition ?? { field: "", op: "filled", value: "" }), ...changes } }, "condition");
  const showing = conditionHolds(condition, scope);

  return (
    <Section
      title="Show"
      action={
        condition?.op && (
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", showing ? "bg-leaf/15 text-leaf" : "bg-secondary text-muted-foreground")}>
            {showing ? "Shows on this product" : "Hidden on this product"}
          </span>
        )
      }
    >
      <Segmented
        value={condition?.op ? "rule" : "always"}
        options={[
          { value: "always", label: "Always" },
          { value: "rule", label: "Only when…" },
        ]}
        onChange={(mode) => onPatch({ condition: mode === "always" ? null : { field: "stock", op: "eq", value: "1" } })}
      />
      {condition?.op && (
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-2">
          {condition.op !== "expr" && (
            <div className="min-w-0">
              <FieldLabel>Value</FieldLabel>
              <select
                aria-label="Value to check"
                value={condition.field ?? ""}
                onChange={(event) => set({ field: event.target.value })}
                className="mt-0.5 h-8 w-full rounded-lg border-[1.5px] border-border bg-surface-elevated px-1 text-[13px]"
              >
                <option value="">Pick…</option>
                {groups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}
          <SelectField
            label="Rule"
            value={condition.op}
            onChange={(next) => set({ op: next })}
            options={CONDITION_OPS.map(({ value, label }) => ({ value, label }))}
            className={condition.op === "expr" ? "col-span-2" : undefined}
          />
          {op?.needsValue !== false && condition.op !== "expr" && (
            <TextField label="Compare with" value={condition.value} onChange={(value) => set({ value })} className="col-span-2" placeholder="1" />
          )}
          {condition.op === "expr" && (
            <TextField
              label="Rule"
              mono
              value={condition.expr}
              onChange={(expr) => set({ expr })}
              className="col-span-2"
              placeholder='offer and offer < price'
              hint="Shows when the rule is true, e.g. stock == 1, offer, price > 1000"
            />
          )}
        </div>
      )}
    </Section>
  );
}

function AlignTools({ count, onAlign, onDistribute }) {
  const tools = [
    ["left", "Align left", AlignStartVertical],
    ["center", "Align centres across", AlignCenterVertical],
    ["right", "Align right", AlignEndVertical],
    ["top", "Align top", AlignStartHorizontal],
    ["middle", "Align middles", AlignCenterHorizontal],
    ["bottom", "Align bottom", AlignEndHorizontal],
  ];
  return (
    <Section title={count === 1 ? "Align to label" : `Align ${count} objects`}>
      <div className="flex flex-wrap items-center gap-0.5">
        {tools.map(([edge, label, Icon]) => (
          <IconButton key={edge} label={label} onClick={() => onAlign(edge)}>
            <Icon />
          </IconButton>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <IconButton label="Distribute across" disabled={count < 3} onClick={() => onDistribute("x")}>
          <AlignHorizontalDistributeCenter />
        </IconButton>
        <IconButton label="Distribute down" disabled={count < 3} onClick={() => onDistribute("y")}>
          <AlignVerticalDistributeCenter />
        </IconButton>
      </div>
    </Section>
  );
}

function ImageSource({ element, onPatch }) {
  const fileRef = useRef(null);
  const { toast } = useToast();
  const upload = async (file) => {
    if (!file) return;
    try {
      const { src, aspect } = await readImageFile(file, { guide: element.guide });
      onPatch({ src, aspect, name: element.name === "Logo" ? file.name.replace(/\.\w+$/, "") : element.name });
    } catch (error) {
      toast({ variant: "destructive", title: "Picture not added", description: error.message });
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPatch({ src: "logo", aspect: 1092 / 181 })}
          className={cn("press h-8 flex-1 rounded-lg border-[1.5px] text-[12px] font-bold", element.src === "logo" ? "border-indigo bg-indigo text-white" : "border-border bg-surface")}
        >
          Shop logo
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="press flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-border bg-surface text-[12px] font-bold">
          <Upload className="h-3.5 w-3.5" /> Upload…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {!element.guide && <p className="text-[11px] text-muted-foreground">Uploads are turned into pure black, the way the thermal printer prints them.</p>}
    </div>
  );
}

/** Properties of the selected object(s). */
export function ObjectPanel({ design, selectedIds, scope, settings, onPatch, onAlign, onDistribute }) {
  const selected = design.elements.filter((element) => selectedIds.includes(element.id));
  const groups = variableGroups(design, settings);

  if (selected.length === 0) {
    return (
      <Section>
        <p className="text-sm text-muted-foreground">
          Select an object on the label or in Layers. Drag across the label to pick several; Shift-click adds to the selection.
        </p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
          <li><span className="kbd">←↑→↓</span> nudge 0.1 mm</li>
          <li><span className="kbd">Shift</span> + arrows 1 mm</li>
          <li><span className="kbd">Ctrl Z</span> undo</li>
          <li><span className="kbd">Ctrl ⇧ Z</span> redo</li>
          <li><span className="kbd">Ctrl D</span> duplicate</li>
          <li><span className="kbd">Del</span> delete</li>
        </ul>
      </Section>
    );
  }

  if (selected.length > 1) {
    return <AlignTools count={selected.length} onAlign={onAlign} onDistribute={onDistribute} />;
  }

  const [element] = selected;
  const patch = (changes, coalesce) => onPatch(element.id, changes, coalesce ? `${element.id}:${coalesce}` : `${element.id}:${Object.keys(changes).join(",")}`);
  const locked = element.locked;

  return (
    <div>
      <Section>
        <TextField label="Name" value={element.name} onChange={(name) => patch({ name })} />
        <div className="grid grid-cols-4 gap-1.5">
          <NumberField label="X" suffix="mm" value={element.x} disabled={locked} onChange={(x) => patch({ x })} />
          <NumberField label="Y" suffix="mm" value={element.y} disabled={locked} onChange={(y) => patch({ y })} />
          <NumberField label="W" suffix="mm" value={element.w} min={0.1} disabled={locked} onChange={(w) => patch(element.type === "qr" ? { w, h: w } : { w })} />
          <NumberField label="H" suffix="mm" value={element.h} min={0.1} disabled={locked} onChange={(h) => patch(element.type === "qr" ? { w: h, h } : { h })} />
        </div>
        <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-end gap-1.5">
          <NumberField label="Rotate" suffix="°" step={1} value={element.rotation} disabled={locked} onChange={(rotation) => patch({ rotation: ((rotation % 360) + 360) % 360 })} />
          <Segmented
            value={element.rotation}
            options={[0, 90, 180, 270].map((value) => ({ value, label: `${value}°` }))}
            onChange={(rotation) => patch({ rotation })}
          />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-0.5 text-[13px] font-semibold">
          <label className="flex items-center gap-2">
            <Switch checked={locked} onCheckedChange={(value) => patch({ locked: value })} /> Locked
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={element.hidden} onCheckedChange={(value) => patch({ hidden: value })} /> Hidden
          </label>
          {element.type === "image" && (
            <label className="flex items-center gap-2" title="A guide photo shows here but never prints">
              <Switch checked={element.guide} onCheckedChange={(value) => patch({ guide: value })} /> Guide only
            </label>
          )}
        </div>
      </Section>

      {element.type === "text" && (
        <Section title="Text">
          <TemplateField
            id={TEXT_INPUT_ID}
            label="Words and values"
            multiline
            value={element.text}
            groups={groups}
            onChange={(text) => patch({ text }, "text")}
            hint={
              <p className="mt-1 truncate rounded-md bg-secondary/70 px-2 py-1 text-[11px]" title="On this product">
                <span className="text-muted-foreground">Prints: </span>
                <b>{renderTemplate(element.text, scope) || "—"}</b>
              </p>
            }
          />
          <FontPicker value={element.fontId} onChange={(fontId) => patch({ fontId })} />
          <div className="grid grid-cols-3 gap-1.5">
            <SelectField label="Weight" value={String(element.fontWeight)} onChange={(value) => patch({ fontWeight: Number(value) })} options={WEIGHTS} className="col-span-1" />
            <NumberField label="Size" suffix="pt" step={0.5} min={2} value={element.fontSize} onChange={(fontSize) => patch({ fontSize, minSize: Math.min(element.minSize ?? fontSize, fontSize) })} />
            <NumberField label="Shrink to" suffix="pt" step={0.5} min={2} value={element.minSize ?? element.fontSize} title="Long text gets smaller down to this size" onChange={(minSize) => patch({ minSize: Math.min(minSize, element.fontSize) })} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <NumberField label="Max lines" step={1} min={1} max={12} value={element.maxLines ?? 1} onChange={(maxLines) => patch({ maxLines: Math.round(maxLines) })} />
            <NumberField label="Spacing" suffix="em" step={0.01} value={element.letterSpacing ?? 0} onChange={(letterSpacing) => patch({ letterSpacing })} />
            <NumberField label="Line height" step={0.05} min={0.6} value={element.lineHeight ?? 1.15} onChange={(lineHeight) => patch({ lineHeight })} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Segmented
              label="Across"
              value={element.align ?? "left"}
              onChange={(align) => patch({ align })}
              options={[
                { value: "left", ariaLabel: "Align text left", icon: AlignLeft },
                { value: "center", ariaLabel: "Centre text", icon: AlignCenter },
                { value: "right", ariaLabel: "Align text right", icon: AlignRight },
              ]}
            />
            <Segmented
              label="Down"
              value={element.vAlign ?? "top"}
              onChange={(vAlign) => patch({ vAlign })}
              options={[
                { value: "top", ariaLabel: "Top of box", icon: ArrowUpToLine },
                { value: "middle", ariaLabel: "Middle of box", icon: FoldVertical },
                { value: "bottom", ariaLabel: "Bottom of box", icon: ArrowDownToLine },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold">
            <label className="flex items-center gap-2">
              <Switch checked={Boolean(element.uppercase)} onCheckedChange={(uppercase) => patch({ uppercase })} /> CAPITALS
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={Boolean(element.italic)} onCheckedChange={(italic) => patch({ italic })} /> Italic
            </label>
            <label className="flex items-center gap-2" title="White text, for use on a black box">
              <Switch checked={element.color === "#fff"} onCheckedChange={(white) => patch({ color: white ? "#fff" : "#000" })} /> White
            </label>
          </div>
        </Section>
      )}

      {element.type === "qr" && (
        <Section title="QR code">
          <TemplateField id="designer-qr-input" label="Contents" value={element.value} groups={groups} onChange={(value) => patch({ value }, "value")} />
          <Segmented
            label="Error correction"
            value={element.ecLevel ?? "M"}
            onChange={(ecLevel) => patch({ ecLevel })}
            options={["L", "M", "Q", "H"].map((value) => ({ value, label: value, ariaLabel: { L: "Low (smallest)", M: "Medium", Q: "Quartile", H: "High (survives scuffs)" }[value] }))}
          />
        </Section>
      )}

      {element.type === "barcode" && (
        <Section title="Barcode">
          <TemplateField id="designer-barcode-input" label="Contents" value={element.value} groups={groups} onChange={(value) => patch({ value }, "value")} />
          <div className="grid grid-cols-2 gap-1.5">
            <SelectField label="Type" value={element.symbology} onChange={(symbology) => patch({ symbology })} options={SYMBOLOGIES.map(({ value, label }) => ({ value, label }))} />
            <NumberField label="Digits size" suffix="pt" step={0.5} min={2} value={element.textSize ?? 5} disabled={!element.showText} onChange={(textSize) => patch({ textSize })} />
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <Switch checked={Boolean(element.showText)} onCheckedChange={(showText) => patch({ showText })} /> Print the digits
          </label>
          {element.symbology !== "code128" && element.symbology !== "code39" && (
            <p className="text-[11px] text-muted-foreground">EAN and UPC need exact digit counts; use pad(12) on shorter codes.</p>
          )}
        </Section>
      )}

      {element.type === "image" && (
        <Section title="Picture">
          <ImageSource element={element} onPatch={(changes) => patch(changes)} />
          <div className="grid grid-cols-2 gap-1.5">
            <Segmented
              label="Fit"
              value={element.fit ?? "contain"}
              onChange={(fit) => patch({ fit })}
              options={[
                { value: "contain", label: "Keep shape" },
                { value: "stretch", label: "Stretch" },
              ]}
            />
            <Segmented
              label="Sit"
              value={element.align ?? "left"}
              onChange={(align) => patch({ align })}
              options={[
                { value: "left", ariaLabel: "Left", icon: AlignLeft },
                { value: "center", ariaLabel: "Centre", icon: AlignCenter },
                { value: "right", ariaLabel: "Right", icon: AlignRight },
              ]}
            />
          </div>
        </Section>
      )}

      {element.type === "line" && (
        <Section title="Line">
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label="Thickness" suffix="mm" step={0.05} min={0.05} value={element.h} onChange={(h) => patch({ h })} />
            <SelectField
              label="Style"
              value={element.dash ?? "solid"}
              onChange={(dash) => patch({ dash })}
              options={[
                { value: "solid", label: "Solid" },
                { value: "dashed", label: "Dashed" },
                { value: "dotted", label: "Dotted" },
              ]}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Rotate 90° for an upright line.</p>
        </Section>
      )}

      {(element.type === "box" || element.type === "ellipse") && (
        <Section title={element.type === "box" ? "Box" : "Ellipse"}>
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField label="Outline" suffix="mm" step={0.05} min={0} value={element.strokeWidth} onChange={(strokeWidth) => patch({ strokeWidth })} />
            {element.type === "box" && <NumberField label="Corners" suffix="mm" step={0.25} min={0} value={element.radius ?? 0} onChange={(radius) => patch({ radius })} />}
          </div>
          <Segmented
            label="Fill"
            value={element.fill ?? "none"}
            onChange={(fill) => patch({ fill })}
            options={[
              { value: "none", label: "None" },
              { value: "black", label: "Black" },
              { value: "white", label: "White" },
            ]}
          />
        </Section>
      )}

      <ConditionEditor element={element} scope={scope} groups={groups} onPatch={patch} />
      <AlignTools count={1} onAlign={onAlign} onDistribute={onDistribute} />
    </div>
  );
}
