import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useGstSettings, useNonSalePatterns } from "../hooks/useGstSettings";
import { Panel } from "./ReportUI";

const FIELDS = [
  { key: "gstin", label: "GSTIN" },
  { key: "stateCode", label: "State code" },
  { key: "stateName", label: "State" },
  { key: "defaultHsn", label: "Default HSN" },
  { key: "defaultDescription", label: "HSN description" },
  { key: "defaultRate", label: "Default rate %", type: "number" },
  { key: "uqc", label: "Unit (UQC)" },
];

const small = "h-9 text-sm";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function GstSettingsPanel({ nonSalePatterns, patternsShared }) {
  const { gst, save, stored } = useGstSettings();
  const patterns = useNonSalePatterns();
  const [rule, setRule] = useState({ match: "", hsn: "", description: "", rate: "" });
  const [pattern, setPattern] = useState("");

  const addRule = () => {
    if (!rule.match.trim() || !rule.hsn.trim()) return;
    save({ rules: [...gst.rules, { ...rule, match: rule.match.trim(), rate: Number(rule.rate) || gst.defaultRate }] });
    setRule({ match: "", hsn: "", description: "", rate: "" });
  };

  return (
    <Panel eyebrow={stored === "cloud" ? "Saved for every device" : "Saved on this device"} title="GST settings">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              className={small}
              type={f.type ?? "text"}
              defaultValue={gst[f.key]}
              onBlur={(e) => {
                const value = f.type === "number" ? Number(e.target.value) || 0 : e.target.value.trim();
                if (value !== gst[f.key]) save({ [f.key]: value });
              }}
            />
          </Field>
        ))}
      </div>

      <div className="mt-6">
        <p className="font-display font-bold">HSN rules</p>
        <p className="text-sm text-muted-foreground">An item whose name contains the word gets that HSN and rate. The first matching rule wins; everything else uses the default above.</p>
        <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
          {gst.rules.map((r, i) => (
            <li key={`${r.match}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="font-bold">“{r.match}”</span>
              <span className="text-muted-foreground">→ HSN {r.hsn} · {r.rate}%{r.description && ` · ${r.description}`}</span>
              <button type="button" aria-label={`Remove rule ${r.match}`} onClick={() => save({ rules: gst.rules.filter((_, j) => j !== i) })} className="press ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
          <li className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-[1fr_7rem_1.4fr_5rem_auto]">
            <Input className={small} placeholder="Word, e.g. PETTICOAT" value={rule.match} onChange={(e) => setRule({ ...rule, match: e.target.value })} aria-label="Word in item name" />
            <Input className={small} placeholder="HSN" value={rule.hsn} onChange={(e) => setRule({ ...rule, hsn: e.target.value })} aria-label="HSN" />
            <Input className={small} placeholder="Description" value={rule.description} onChange={(e) => setRule({ ...rule, description: e.target.value })} aria-label="Description" />
            <Input className={small} placeholder="Rate %" type="number" value={rule.rate} onChange={(e) => setRule({ ...rule, rate: e.target.value })} aria-label="Rate" />
            <button type="button" onClick={addRule} className="press inline-flex h-9 items-center justify-center gap-1 rounded-xl bg-indigo px-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" aria-hidden /> Add
            </button>
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <p className="font-display font-bold">Not a sale</p>
        <p className="text-sm text-muted-foreground">
          Bill lines matching these patterns are money, not goods (old dues, deposits, advances). They are left out of sales and GST here and in the accounts ledger.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {nonSalePatterns.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-elevated py-1 pl-3 pr-1 font-mono text-xs">
              {p}
              {patternsShared && (
                <button type="button" aria-label={`Remove ${p}`} disabled={patterns.busy} onClick={() => patterns.remove(p)} className="press rounded-full p-1 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              )}
            </span>
          ))}
        </div>
        {patternsShared ? (
          <form
            className="mt-2 flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pattern.trim()) patterns.add(pattern.trim(), { onSuccess: () => setPattern("") });
            }}
          >
            <Input className={`${small} font-mono`} placeholder="e.g. ^OLD BALANCE" value={pattern} onChange={(e) => setPattern(e.target.value)} aria-label="New pattern" />
            <button type="submit" disabled={patterns.busy} className="press h-9 rounded-xl bg-indigo px-3 text-sm font-bold text-white disabled:opacity-50">Add</button>
          </form>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">These are the built-in patterns. They become editable once the shared list is set up in the database.</p>
        )}
        {patterns.error && <p className="mt-1 text-xs text-destructive">{patterns.error.message}</p>}
      </div>
    </Panel>
  );
}
