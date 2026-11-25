import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normName } from "../lib/lines";
import { rateLabel, taxFor } from "../lib/gst";
import { rupees } from "../lib/format";
import { DataTable, Panel, Pills } from "./ReportUI";

const SHOW = [
  { value: "all", label: "All items" },
  { value: "default", label: "Using default" },
  { value: "picked", label: "Picked" },
];

/** Every item sold in the period with the HSN it will be filed under; changing one applies to that item name from now on. */
export function ItemHsnPanel({ bills, settings, save }) {
  const [query, setQuery] = useState("");
  const [show, setShow] = useState("all");

  const items = useMemo(() => {
    const map = new Map();
    for (const bill of bills)
      for (const line of bill.lines) {
        if (line.kind === "adjustment") continue;
        const row = map.get(line.name) ?? { name: line.name, quantity: 0, value: 0, sample: line };
        row.quantity += line.quantity;
        row.value += line.amount;
        map.set(line.name, row);
      }
    return [...map.values()];
  }, [bills]);

  const choose = (name, code) => {
    const next = { ...settings.itemHsn };
    if (code) next[normName(name)] = code;
    else delete next[normName(name)];
    save({ itemHsn: next });
  };

  const needle = query.trim().toUpperCase();
  const rows = items
    .map((item) => ({ ...item, picked: settings.itemHsn?.[item.name] ?? "", tax: taxFor(item.sample, settings) }))
    .filter((r) => (!needle || r.name.includes(needle)) && (show === "all" || (show === "picked" ? r.picked : !r.tax.ruled)));

  const pickAll = (code) => {
    const next = { ...settings.itemHsn };
    rows.forEach((r) => (code ? (next[r.name] = code) : delete next[r.name]));
    save({ itemHsn: next });
  };

  return (
    <Panel
      eyebrow="Picked HSN stays with the item name for every period"
      title="HSN for each item"
      actions={
        <>
          <div className="relative w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find item, e.g. BLOUSE" aria-label="Find item" className="h-8 pl-9 text-sm" />
          </div>
          <Pills options={SHOW} value={show} onChange={setShow} label="Show items" />
        </>
      }
    >
      {needle && rows.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-indigo/5 px-3 py-2 text-sm">
          <span>Set all {rows.length} items matching “{query.trim()}” to</span>
          {settings.hsnCodes.map((c) => (
            <button key={c.code} type="button" onClick={() => pickAll(c.code)} className="press rounded-full border-[1.5px] border-border bg-surface px-2.5 py-0.5 text-xs font-bold hover:border-indigo/40">
              {c.code}
            </button>
          ))}
          <button type="button" onClick={() => pickAll("")} className="press text-xs font-bold text-rani hover:underline">Clear</button>
        </div>
      )}
      <DataTable
        key={`${show}-${needle}`}
        columns={[
          { key: "name", header: "Item", className: "font-semibold" },
          { key: "quantity", header: "Pieces", align: "right" },
          { key: "value", header: "Value", align: "right", render: (r) => rupees(r.value) },
          {
            key: "hsn",
            header: "HSN",
            value: (r) => r.tax.hsn,
            render: (r) => (
              <select
                aria-label={`HSN for ${r.name}`}
                value={r.picked}
                onChange={(e) => choose(r.name, e.target.value)}
                className={`h-8 rounded-lg border-[1.5px] px-2 text-xs font-bold ${r.picked ? "border-indigo" : "border-border text-muted-foreground"}`}
              >
                <option value="">{r.tax.ruled && !r.picked ? `Rule: ${r.tax.hsn}` : `Default: ${settings.defaultHsn}`}</option>
                {settings.hsnCodes.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} · {c.description} · {rateLabel(c.rate)}</option>
                ))}
              </select>
            ),
          },
          { key: "rate", header: "Rate", align: "right", value: (r) => r.tax.rate, render: (r) => (r.tax.slab ? "By price" : `${r.tax.rate}%`) },
        ]}
        rows={rows}
        initialSort={{ key: "value", asc: false }}
        rowKey={(r) => r.name}
        empty="No items match."
      />
    </Panel>
  );
}
