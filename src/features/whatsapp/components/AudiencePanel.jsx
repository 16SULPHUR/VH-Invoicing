import { Contact, Lock, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AUDIENCES } from "../lib/audiences";
import { KINDS, LANGUAGES } from "../lib/templates";

export function Segmented({ value, options, onChange, label, className = "" }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full bg-secondary p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "press flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
            value === option.value ? "bg-indigo text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** The chosen group, template and language in one line, for phones. */
export function AudienceSummary({ form, templates, onOpen }) {
  const audience = AUDIENCES.find(({ id }) => id === form.audienceId);
  const template = form.templateId === "auto" ? "Gentle, firm or final" : templates.find(({ id }) => id === form.templateId)?.name;
  const language = LANGUAGES.find(({ value }) => value === form.language)?.label;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="press flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-[0_1px_0_hsl(var(--border))]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo text-white">
        <Users className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{audience?.label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {template} · {language}
        </span>
      </span>
      <span className="text-sm font-bold text-rani">Change</span>
    </button>
  );
}

/** Who to message, with which template, in which language. */
export function AudiencePanel({ form, setForm, templates, kind, contactCount, onExportContacts, onDone }) {
  const audience = AUDIENCES.find(({ id }) => id === form.audienceId);
  const offers = kind === "marketing";
  const groups = Object.entries(KINDS).map(([value, { label }]) => ({
    value,
    label,
    templates: templates.filter((template) => template.kind === value),
  }));

  return (
    <section className="space-y-4 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
      <div className="space-y-2">
        <p className="eyebrow">Who</p>
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={form.audienceId === id}
              onClick={() => setForm({ audienceId: id })}
              className={cn(
                "press rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold transition-colors",
                form.audienceId === id ? "border-indigo bg-indigo text-white" : "border-border hover:border-indigo/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{audience?.hint}</p>
      </div>

      {form.audienceId === "keyword" && (
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="wa-keyword" className="text-xs font-semibold text-muted-foreground">
              Word in the item name
            </Label>
            <Input id="wa-keyword" value={form.keyword} onChange={(event) => setForm({ keyword: event.target.value })} placeholder="saree" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wa-keyword-days" className="text-xs font-semibold text-muted-foreground">
              In last (days)
            </Label>
            <Input
              id="wa-keyword-days"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.keywordDays}
              onChange={(event) => setForm({ keywordDays: Math.max(1, Number(event.target.value) || 1) })}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="wa-template" className="eyebrow text-[11px]">
          Message
        </Label>
        <Select value={form.templateId} onValueChange={(templateId) => setForm({ templateId })}>
          <SelectTrigger id="wa-template" className="h-10 rounded-xl bg-surface-elevated">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {form.audienceId === "dues" && <SelectItem value="auto">Gentle, firm or final by bill age</SelectItem>}
            {groups.map((group) =>
              group.templates.length === 0 ? null : (
                <SelectGroup key={group.value}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Language" value={form.language} options={LANGUAGES} onChange={(language) => setForm({ language })} />
        <label className="flex items-center gap-2 text-[13px] font-semibold">
          <Switch
            checked={offers || form.optedInOnly}
            disabled={offers}
            onCheckedChange={(optedInOnly) => setForm({ optedInOnly })}
            aria-describedby="wa-optin-note"
          />
          Only who said yes
          {offers && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
        </label>
      </div>
      {offers && (
        <p id="wa-optin-note" className="-mt-2 text-xs text-muted-foreground">
          Offers and greetings only go to customers who said yes to WhatsApp offers.
        </p>
      )}

      {kind !== "dues" && (
        <div className="space-y-1.5">
          <Label htmlFor="wa-campaign" className="eyebrow text-[11px]">
            Campaign
          </Label>
          <Input id="wa-campaign" value={form.campaign} onChange={(event) => setForm({ campaign: event.target.value })} />
          <p className="text-xs text-muted-foreground">Nobody gets the same campaign twice.</p>
        </div>
      )}

      <button
        type="button"
        onClick={onExportContacts}
        disabled={contactCount === 0}
        className="press flex w-full items-center gap-3 rounded-xl border-[1.5px] border-dashed border-border px-3 py-2.5 text-left hover:border-indigo/40 disabled:opacity-50"
      >
        <Contact className="h-5 w-5 shrink-0 text-indigo" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-bold">Contacts file · {contactCount}</span>
          <span className="block text-xs text-muted-foreground">Save these numbers to the shop phone for a broadcast list.</span>
        </span>
      </button>

      {onDone && (
        <button type="button" onClick={onDone} className="press block-shadow h-11 w-full rounded-xl bg-indigo font-bold text-white">
          Show messages
        </button>
      )}
    </section>
  );
}
