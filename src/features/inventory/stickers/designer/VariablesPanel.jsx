import { useEffect, useState } from "react";
import { ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatRupees } from "@/utils/formatters";
import { SHOP_FIELDS } from "@/features/settings/useShopSettings";
import { newId } from "../designModel";
import { FORMATTERS, evaluate, toText, validCodeWord } from "../expr";
import { NAME_PATTERN, PRODUCT_VARIABLES, RUN_VARIABLES, VARIABLE_KINDS, isBuiltInName, toVariableName } from "../variables";
import { FieldLabel, IconButton, NumberField, Section, SelectField, TextField } from "./fields";

const PRESETS = [
  { label: "MRP (price × 1.25, ends in 9)", variable: { kind: "formula", name: "mrp", label: "MRP", expr: "price * 1.25 | end9" } },
  { label: "Saving (MRP − price)", variable: { kind: "formula", name: "saving", label: "Saving", expr: "mrp - price" } },
  { label: "Offer price, asked at print", variable: { kind: "prompt", name: "offer", label: "Offer price", default: "" } },
  { label: "Serial number 0001, 0002…", variable: { kind: "counter", name: "serial", label: "Serial", start: 1, step: 1, pad: 4, per: "run" } },
  { label: "Packed month (MMM YY)", variable: { kind: "date", name: "packed", label: "Packed", source: "print", offset: 0, format: "MMM YY" } },
];

const shown = (value) => {
  const text = toText(value);
  return text === "" ? "—" : text;
};

function ValueList({ items, scope }) {
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-x-3 gap-y-1 text-[12px]">
      {items.map(({ name, label }) => (
        <div key={name} className="contents">
          <dt className="truncate" title={label}>
            <code className="font-mono text-[11px] font-semibold text-indigo">{`{${name}}`}</code>
          </dt>
          <dd className="truncate text-right tabular-nums text-muted-foreground" title={shown(scope.get(name))}>
            {shown(scope.get(name))}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** A text input that saves on blur or Enter, for values that sync to the shop. */
function CommitField({ label, value, onCommit, placeholder, error, hint, mono }) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);
  return (
    <TextField
      label={label}
      value={draft}
      placeholder={placeholder}
      mono={mono}
      error={error?.(draft)}
      hint={hint}
      onChange={setDraft}
      onBlur={() => draft !== (value ?? "") && onCommit(draft)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
    />
  );
}

function VariableCard({ variable, design, scope, onChange, onRename, onRemove }) {
  const [name, setName] = useState(variable.name);
  useEffect(() => setName(variable.name), [variable.name]);
  const clash =
    name !== variable.name &&
    (!NAME_PATTERN.test(name) ? "Use lowercase letters, digits and _" : isBuiltInName(name) || design.variables.some((other) => other.name === name) ? "That name is taken" : null);
  const set = (changes) => onChange({ ...variable, ...changes });
  const errors = [];
  const value = variable.kind === "formula" ? evaluate(variable.expr, { ...scope, errors }) : scope.get(variable.name);

  return (
    <li className="space-y-2 rounded-xl border-[1.5px] border-border bg-surface p-2.5">
      <div className="flex items-start gap-1.5">
        <TextField
          label="Name"
          mono
          value={name}
          error={clash}
          onChange={(next) => setName(next.toLowerCase().replace(/\s+/g, "_"))}
          onBlur={() => (clash || !name ? setName(variable.name) : name !== variable.name && onRename(variable.name, name))}
          onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          className="flex-1"
        />
        <SelectField label="Kind" value={variable.kind} onChange={(kind) => set({ kind })} options={VARIABLE_KINDS} className="w-[7.5rem]" />
        <IconButton label={`Delete ${variable.name}`} onClick={onRemove} className="mt-4 hover:text-destructive">
          <Trash2 />
        </IconButton>
      </div>

      {variable.kind === "formula" && (
        <TextField label="Formula" mono value={variable.expr} placeholder="price * 1.25 | end9" onChange={(expr) => set({ expr })} />
      )}
      {variable.kind === "prompt" && (
        <div className="grid grid-cols-2 gap-1.5">
          <TextField label="Question" value={variable.label} placeholder="Offer price" onChange={(label) => set({ label })} />
          <TextField label="Default" value={variable.default} placeholder="Leave empty" onChange={(value) => set({ default: value })} />
        </div>
      )}
      {variable.kind === "text" && <TextField label="Text" value={variable.value} onChange={(value) => set({ value })} />}
      {variable.kind === "counter" && (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <NumberField label="Start" step={1} value={variable.start ?? 1} onChange={(start) => set({ start })} />
            <NumberField label="Step" step={1} value={variable.step ?? 1} onChange={(step) => set({ step })} />
            <NumberField label="Digits" step={1} min={0} max={10} value={variable.pad ?? 0} onChange={(pad) => set({ pad: Math.round(pad) })} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <SelectField
              label="Counts"
              value={variable.per ?? "run"}
              onChange={(per) => set({ per })}
              options={[
                { value: "run", label: "Across the run" },
                { value: "product", label: "Within a product" },
              ]}
            />
            <SelectField
              label="Next run"
              value={variable.carry ? "carry" : "restart"}
              onChange={(mode) => set({ carry: mode === "carry" })}
              options={[
                { value: "restart", label: "Starts again" },
                { value: "carry", label: "Carries on" },
              ]}
            />
          </div>
        </>
      )}
      {variable.kind === "date" && (
        <div className="grid grid-cols-2 gap-1.5">
          <SelectField
            label="Date"
            value={variable.source ?? "print"}
            onChange={(source) => set({ source })}
            options={[
              { value: "print", label: "Print date" },
              { value: "fixed", label: "Fixed date" },
            ]}
          />
          {variable.source === "fixed" ? (
            <TextField label="On" type="date" value={variable.date} onChange={(date) => set({ date })} />
          ) : (
            <NumberField label="Plus days" step={1} value={variable.offset ?? 0} onChange={(offset) => set({ offset: Math.round(offset) })} />
          )}
          <TextField label="Format" mono value={variable.format} placeholder="DD MMM YYYY" onChange={(format) => set({ format })} className="col-span-2" hint="DD D MM M MMM MMMM YY YYYY ddd" />
        </div>
      )}

      <p className={cn("truncate rounded-md px-2 py-1 font-mono text-[12px]", errors.length ? "bg-destructive/10 text-destructive" : "bg-secondary/70")}>
        {errors.length ? errors[0] : `= ${shown(value)}`}
      </p>
    </li>
  );
}

function ProductPreviewPicker({ products, product, onPick }) {
  const [term, setTerm] = useState("");
  const needle = term.trim().toLowerCase();
  const matches = needle
    ? products.filter((candidate) => [candidate.name, candidate.barcode].some((field) => String(field ?? "").toLowerCase().includes(needle))).slice(0, 6)
    : [];
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Preview with a product (name or code)…"
          aria-label="Preview with a product"
          className="h-9 w-full rounded-lg border-[1.5px] border-border bg-surface-elevated pl-8 pr-2 text-[13px] focus-visible:border-rani/50 focus-visible:outline-none"
        />
        {matches.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            {matches.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(candidate);
                    setTerm("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-secondary"
                >
                  <span className="truncate font-semibold">{candidate.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {candidate.barcode} · {formatRupees(candidate.sellingPrice)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-indigo/5 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{product.name}</p>
          <p className="truncate text-[11px] tabular-nums text-muted-foreground">
            {product.id === "sample" ? "Sample product" : `${product.barcode} · ${formatRupees(product.sellingPrice)} · stock ${product.quantity ?? 0}`}
          </p>
        </div>
        {product.id !== "sample" && (
          <IconButton label="Back to the sample product" onClick={() => onPick(null)}>
            <X />
          </IconButton>
        )}
      </div>
    </div>
  );
}

/** Every value a design can print, the design's own variables, and shop-wide values. */
export function VariablesPanel({ design, scope, products, product, onPickProduct, settings, onSaveSettings, settingsStored, attributesAvailable, onVariables, onRenameVariable }) {
  const [test, setTest] = useState("price * 1.25 | end9 | inr");
  const testErrors = [];
  const testValue = evaluate(test, { ...scope, errors: testErrors });
  const [newField, setNewField] = useState("");

  const add = (variable) => {
    let name = variable.name;
    for (let n = 2; design.variables.some((other) => other.name === name) || isBuiltInName(name); n += 1) name = `${variable.name}${n}`;
    onVariables([...design.variables, { id: newId(), ...variable, name }]);
  };

  const addField = () => {
    const key = toVariableName(newField);
    if (!key || settings.product_fields.some((field) => field.key === key) || isBuiltInName(key)) return;
    onSaveSettings({ product_fields: [...settings.product_fields, { key, label: newField.trim() }] });
    setNewField("");
  };

  return (
    <div>
      <Section title="Preview with">
        <ProductPreviewPicker products={products} product={product} onPick={onPickProduct} />
      </Section>

      <Section
        title="This design's values"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="press -my-1 flex h-7 items-center gap-1 rounded-lg bg-indigo px-2 text-[12px] font-bold text-white">
                <Plus className="h-3.5 w-3.5" /> Add <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Ready-made</DropdownMenuLabel>
              {PRESETS.map((preset) => (
                <DropdownMenuItem key={preset.label} onClick={() => add(preset.variable)}>
                  {preset.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Blank</DropdownMenuLabel>
              {VARIABLE_KINDS.map((kind) => (
                <DropdownMenuItem key={kind.value} onClick={() => add({ kind: kind.value, name: kind.value === "prompt" ? "ask" : kind.value, label: "", expr: "", value: "", start: 1, step: 1, pad: 0 })}>
                  <span>
                    {kind.label}
                    <span className="block text-[11px] text-muted-foreground">{kind.help}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        {design.variables.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            Formulas like an MRP from the price, questions asked when printing (an offer price), counters and dates. Use them in text as {"{mrp}"}.
          </p>
        ) : (
          <ul className="space-y-2">
            {design.variables.map((variable) => (
              <VariableCard
                key={variable.id ?? variable.name}
                variable={variable}
                design={design}
                scope={scope}
                onChange={(next) => onVariables(design.variables.map((other) => (other === variable ? next : other)))}
                onRename={onRenameVariable}
                onRemove={() => onVariables(design.variables.filter((other) => other !== variable))}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Product">
        <ValueList items={PRODUCT_VARIABLES} scope={scope} />
        {!validCodeWord(settings.cost_code_word) && (
          <p className="rounded-lg bg-marigold/15 px-2.5 py-1.5 text-[11px] text-warning">
            {"{cost_code}"} needs a 10-letter code word. Set it under Shop values below.
          </p>
        )}
      </Section>

      <Section title="Product details">
        {!attributesAvailable && (
          <p className="rounded-lg bg-marigold/15 px-2.5 py-1.5 text-[11px] text-warning">
            Products can&apos;t store these yet. Run docs/schema/sticker_designer.sql in Supabase to add them.
          </p>
        )}
        <ValueList items={settings.product_fields.map(({ key, label }) => ({ name: key, label }))} scope={scope} />
        <div className="flex items-end gap-1.5">
          <TextField label="New detail" value={newField} placeholder="e.g. Blouse piece" onChange={setNewField} onKeyDown={(event) => event.key === "Enter" && addField()} className="flex-1" />
          <button type="button" onClick={addField} disabled={!toVariableName(newField)} className="press h-8 rounded-lg bg-secondary px-3 text-[12px] font-bold disabled:opacity-40">
            Add
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">Filled in on Add product and Edit product.</p>
      </Section>

      <Section title="Shop values" action={settingsStored === "device" && <span className="text-[10px] font-bold text-warning">This device only</span>}>
        <div className="grid grid-cols-2 gap-2">
          {SHOP_FIELDS.map(({ key, label, placeholder }) => (
            <CommitField
              key={key}
              label={label}
              value={settings[key]}
              placeholder={placeholder}
              mono={key === "cost_code_word"}
              error={key === "cost_code_word" ? (draft) => (draft && !validCodeWord(draft) ? "10 letters, none repeated" : null) : undefined}
              hint={key === "cost_code_word" && validCodeWord(settings.cost_code_word) ? `${settings.cost_code_word.toUpperCase().slice(0, 9)} = 1–9, ${settings.cost_code_word.toUpperCase()[9]} = 0` : undefined}
              onCommit={(value) => onSaveSettings({ [key]: key === "cost_code_word" ? value.trim().toUpperCase() : value })}
            />
          ))}
        </div>
        {settingsStored === "device" && (
          <p className="text-[11px] text-muted-foreground">Saved in this browser until docs/schema/sticker_designer.sql is run.</p>
        )}
      </Section>

      <Section title="Print run">
        <ValueList items={RUN_VARIABLES} scope={scope} />
      </Section>

      <Section title="Try a formula">
        <TextField mono value={test} onChange={setTest} aria-label="Formula to try" />
        <p className={cn("truncate rounded-md px-2 py-1 font-mono text-[12px]", testErrors.length ? "bg-destructive/10 text-destructive" : "bg-secondary/70")}>
          {testErrors.length ? testErrors[0] : `= ${shown(testValue)}`}
        </p>
        <details className="text-[12px]">
          <summary className="cursor-pointer font-bold text-indigo">Formatters and rules</summary>
          <p className="mt-2 text-muted-foreground">
            Numbers: + − × / and ( ). Compare with == != &gt; &lt;, combine with and / or, choose with rule ? &quot;yes&quot; : &quot;no&quot;. Chain formatters with |.
          </p>
          <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            {Object.entries(FORMATTERS).map(([name, { help }]) => (
              <div key={name} className="contents">
                <dt>
                  <code className="font-mono text-[11px] font-semibold text-indigo">{name}</code>
                </dt>
                <dd className="text-muted-foreground">{help}</dd>
              </div>
            ))}
          </dl>
        </details>
        <FieldLabel className="pt-1">Examples</FieldLabel>
        <ul className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
          <li>{"Save ₹{mrp - price}"}</li>
          <li>{'{stock == 1 ? "Last piece" : ""}'}</li>
          <li>{"{name | first | upper}"}</li>
          <li>{"{cost | costcode}{age_code}"}</li>
        </ul>
      </Section>
    </div>
  );
}
