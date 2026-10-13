import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopSettings } from "@/features/settings/useShopSettings";

const IDENTITY = [
  { key: "shop_name", label: "Shop name", hint: "Bill, messages, pay page, stickers" },
  { key: "tagline", label: "Tagline", hint: "Link previews" },
  { key: "phone", label: "Shop phone", type: "tel", hint: "Messages as {shop_phone}" },
  { key: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/91…", hint: "QR on the bill" },
  { key: "upi_id", label: "UPI ID", hint: "Where pay-page payments go" },
];

const toLines = (text) => text.split("\n").map((line) => line.trim()).filter(Boolean);

const slug = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "work";

function Section({ title, hint, children }) {
  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
      <div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextField({ id, value, onCommit, ...props }) {
  return (
    <Input
      id={id}
      key={String(value)}
      defaultValue={value}
      onBlur={(event) => event.target.value.trim() !== String(value) && onCommit(event.target.value.trim())}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      {...props}
    />
  );
}

function LinesField({ id, value, onCommit, rows = 4 }) {
  const text = value.join("\n");
  return (
    <textarea
      id={id}
      key={text}
      rows={rows}
      defaultValue={text}
      onBlur={(event) => event.target.value !== text && onCommit(toLines(event.target.value))}
      className="flex w-full rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 py-2 text-[15px] transition-colors focus-visible:border-rani/50 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rani/20"
    />
  );
}

function WorkTypes({ kinds, onChange }) {
  const update = (index, changes) => onChange(kinds.map((kind, i) => (i === index ? { ...kind, ...changes } : kind)));
  const add = () => {
    const taken = new Set(kinds.map(({ value }) => value));
    let value = "new_work";
    for (let n = 2; taken.has(value); n += 1) value = `new_work_${n}`;
    onChange([...kinds, { value, label: "New work", days: 3 }]);
  };

  return (
    <div className="space-y-2">
      {kinds.map((kind, index) => (
        <div key={kind.value} className="flex items-center gap-2">
          <TextField
            aria-label="Name of the work"
            value={kind.label}
            onCommit={(label) => label && update(index, { label, value: kind.value.startsWith("new_work") ? slug(label) : kind.value })}
          />
          <TextField
            aria-label="Days to finish"
            className="w-20 shrink-0"
            type="number"
            min={0}
            value={kind.days}
            onCommit={(days) => update(index, { days: Math.max(0, Math.round(Number(days)) || 0) })}
          />
          <span className="shrink-0 text-xs text-muted-foreground">days</span>
          <Button variant="ghost" size="icon" aria-label={`Remove ${kind.label}`} disabled={kinds.length === 1} onClick={() => onChange(kinds.filter((_, i) => i !== index))}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-4 w-4" aria-hidden /> Add work type
      </Button>
    </div>
  );
}

export default function ShopPage() {
  const { settings, save, stored } = useShopSettings();

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 p-4">
      <PageHeader title="Shop" subtitle="Everything that makes this your shop. Changes apply as soon as you leave a field." />
      {stored === "device" && (
        <p className="rounded-xl bg-warning/10 px-3 py-2 text-xs font-semibold text-warning">
          Saved in this browser only until docs/schema/sticker_designer.sql is run.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Section title="Shop details">
          <div className="grid gap-3 sm:grid-cols-2">
            {IDENTITY.map(({ key, label, hint, type, placeholder }) => (
              <Field key={key} id={`shop-${key}`} label={label} hint={hint}>
                <TextField id={`shop-${key}`} type={type} placeholder={placeholder} value={settings[key] ?? ""} onCommit={(value) => save({ [key]: value })} />
              </Field>
            ))}
          </div>
        </Section>

        <Section title="Printed bill" hint="GSTIN comes from Reports > GST.">
          <Field id="shop-address" label="Address">
            <TextField id="shop-address" value={settings.address} onCommit={(address) => save({ address })} />
          </Field>
          <Field id="shop-contacts" label="Contact lines" hint="One per line: phones, handle, email">
            <LinesField id="shop-contacts" value={settings.bill_contacts} rows={3} onCommit={(bill_contacts) => save({ bill_contacts })} />
          </Field>
          <Field id="shop-terms" label="Terms" hint="One per line">
            <LinesField id="shop-terms" value={settings.bill_terms} rows={5} onCommit={(bill_terms) => save({ bill_terms })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="shop-logo" label="Logo image" hint="File name or link. Empty prints the shop name.">
              <TextField id="shop-logo" value={settings.logo_url} onCommit={(logo_url) => save({ logo_url })} />
            </Field>
            <Field id="shop-signature" label="Signature image" hint="Empty prints no signature.">
              <TextField id="shop-signature" value={settings.signature_url} onCommit={(signature_url) => save({ signature_url })} />
            </Field>
          </div>
        </Section>

        <Section title="What you sell" hint="Used in offer messages as {products}.">
          <Field id="shop-products" label="Products">
            <TextField id="shop-products" value={settings.product_types} onCommit={(product_types) => save({ product_types })} />
          </Field>
          <p className="text-xs text-muted-foreground">
            Extra product details like fabric or size are under Inventory, and HSN codes and tax rates under{" "}
            <Link className="font-semibold text-indigo underline" to="/reports/gst">Reports &gt; GST</Link>.
          </p>
        </Section>

        <Section title="Counter work types" hint="The jobs you take in at Counter, with the usual days to finish.">
          <WorkTypes kinds={settings.job_kinds} onChange={(job_kinds) => save({ job_kinds })} />
        </Section>
      </div>
    </div>
  );
}
