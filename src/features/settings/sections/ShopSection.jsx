import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validCodeWord } from "@/features/inventory/stickers/expr";
import { isBuiltInName, toVariableName } from "@/features/inventory/stickers/variables";
import { useGstSettings } from "@/features/reports/hooks/useGstSettings";
import { CommitInput, Section, StoredBadge, ValueFields } from "../components/fields";

const SHOP_VALUES = [
  { key: "shop_name", label: "Shop name", hint: "On stickers, slips, messages and the pay page." },
  { key: "tagline", label: "Tagline" },
  { key: "address", label: "Address", hint: "Printed at the top of reports.", className: "sm:col-span-2" },
  { key: "phone", label: "Shop phone", type: "tel", hint: "{shop_phone} in messages." },
  { key: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/91…" },
  { key: "upi_id", label: "UPI ID", hint: "Where pay-page payments go. Use the shop's merchant UPI ID." },
  { key: "wa_channel", label: "WhatsApp channel link", placeholder: "https://whatsapp.com/channel/…", hint: "{channel_link} in messages." },
];

const COST_CODE = {
  key: "cost_code_word",
  label: "Cost code word",
  placeholder: "10 different letters",
  normalize: (value) => value.trim().toUpperCase(),
  error: (word) => (word && !validCodeWord(word) ? "10 letters, none repeated" : null),
};

function codeHint(word) {
  if (!validCodeWord(word)) return "Prints the cost price in letters on stickers as {cost_code}.";
  const letters = word.toUpperCase();
  return `${letters.slice(0, 9)} = 1 to 9, ${letters[9]} = 0`;
}

function ProductFields({ fields, save }) {
  const [label, setLabel] = useState("");
  const key = toVariableName(label);
  const taken = fields.some((field) => field.key === key) || isBuiltInName(key);

  const add = () => {
    if (!key || taken) return;
    save({ product_fields: [...fields, { key, label: label.trim() }] });
    setLabel("");
  };

  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {fields.map((field) => (
          <li key={field.key} className="flex items-center gap-2 px-3 py-1.5">
            <CommitInput
              aria-label={`Name for ${field.key}`}
              value={field.label}
              className="h-8 flex-1 border-transparent bg-transparent px-1 text-sm shadow-none"
              onCommit={(next) => next.trim() && save({ product_fields: fields.map((f) => (f.key === field.key ? { ...f, label: next.trim() } : f)) })}
            />
            <code className="text-[11px] text-muted-foreground">{`{${field.key}}`}</code>
            <button
              type="button"
              aria-label={`Remove ${field.label}`}
              onClick={() => window.confirm(`Stop asking for “${field.label}” on products? Values already saved stay on the products.`) && save({ product_fields: fields.filter((f) => f.key !== field.key) })}
              className="press rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Blouse piece" aria-label="New product detail" className="h-9" />
        <Button type="submit" size="sm" disabled={!key || taken} className="h-9 shrink-0">
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Add
        </Button>
      </form>
      {key && taken && <p className="text-[11px] text-destructive">That name is already used.</p>}
    </div>
  );
}

export function ShopSection({ shop }) {
  const { settings, save, stored } = shop;
  const { gst, save: saveGst } = useGstSettings();
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Section title="Shop details" aside={<StoredBadge stored={stored} />}>
        <ValueFields fields={SHOP_VALUES} settings={settings} save={save} />
        <ValueFields
          fields={[{ key: "gstin", label: "GSTIN", hint: "Printed at the top of reports. Same as Settings › GST.", normalize: (value) => value.trim().toUpperCase() }]}
          settings={gst}
          save={saveGst}
        />
      </Section>
      <div className="space-y-4">
        <Section title="Cost code" description="Lets staff read the cost on a sticker without customers knowing.">
          <ValueFields fields={[{ ...COST_CODE, hint: codeHint(settings.cost_code_word) }]} settings={settings} save={save} />
        </Section>
        <Section title="Product details" description="Extra fields filled in on Add product and Edit product, and printable on stickers.">
          <ProductFields fields={settings.product_fields} save={save} />
        </Section>
      </div>
    </div>
  );
}
