import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatRupees } from "@/utils/formatters";
import { appOrigin } from "../lib/rules";
import { BLANKS, DEFAULT_TEMPLATES, KINDS, LANGUAGES, isDefaultTemplate, messageVars, renderTemplate } from "../lib/templates";
import { useCustomerDirectory, useWhatsAppSetup } from "../hooks/useWhatsApp";
import { MessageBubble } from "./MessageBubble";
import { Segmented } from "./AudiencePanel";

const KNOWN = new Set(BLANKS.map(({ key }) => key));
const unknownBlanks = (text) => [...new Set([...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].filter((key) => !KNOWN.has(key));

function TemplateList({ templates, selectedId, onSelect, onAdd }) {
  return (
    <nav aria-label="Templates" className="space-y-3">
      {Object.entries(KINDS).map(([kind, { label }]) => (
        <div key={kind} className="space-y-1">
          <p className="eyebrow px-2">{label}</p>
          {templates
            .filter((template) => template.kind === kind)
            .map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => onSelect(template.id)}
                className={cn(
                  "press block w-full truncate rounded-xl px-3 py-2 text-left text-sm font-semibold",
                  selectedId === template.id ? "bg-indigo text-white" : "hover:bg-secondary"
                )}
              >
                {template.name}
              </button>
            ))}
        </div>
      ))}
      <Button variant="outline" className="press w-full" onClick={onAdd}>
        <Plus className="h-4 w-4" aria-hidden /> New template
      </Button>
    </nav>
  );
}

/** Edit a template's Hinglish and English text, with a live preview for a real customer. */
export function TemplatesTab({ wa }) {
  const { templates, settings, rules } = wa;
  const setup = useWhatsAppSetup();
  const { directory } = useCustomerDirectory();
  const [selectedId, setSelectedId] = useState(templates[0]?.id);
  const [language, setLanguage] = useState(rules.language);
  const [draft, setDraft] = useState(null);
  const [previewKey, setPreviewKey] = useState(null);
  const textRef = useRef(null);

  const saved = templates.find(({ id }) => id === selectedId) ?? templates[0];
  useEffect(() => setDraft(saved ? { ...saved } : null), [saved]);

  const sampleCustomers = useMemo(
    () =>
      [...directory]
        .filter((entry) => entry.name && entry.phone)
        .sort((a, b) => b.due - a.due || String(b.lastVisit).localeCompare(String(a.lastVisit)))
        .slice(0, 40),
    [directory]
  );
  const customer = sampleCustomers.find(({ key }) => key === previewKey) ?? sampleCustomers[0];

  if (!draft) return null;

  const dirty = ["name", "kind", "hi", "en"].some((key) => draft[key] !== saved[key]);
  const original = DEFAULT_TEMPLATES.find(({ id }) => id === draft.id);
  const changedFromDefault = original && ["name", "kind", "hi", "en"].some((key) => saved[key] !== original[key]);
  const body = draft[language] ?? "";
  const unknown = unknownBlanks(`${draft.hi}\n${draft.en}`);
  const payLink = setup?.payLinks ? `${appOrigin(rules)}/pay/5b1e0c2a-7d4f-4b8e-9a31-2f6c8e0d4a17` : "";
  const preview = customer ? renderTemplate(body, messageVars(customer, { settings, payLink })) : "";

  const insert = (key) => {
    const field = textRef.current;
    const token = `{${key}}`;
    const start = field?.selectionStart ?? body.length;
    const end = field?.selectionEnd ?? body.length;
    setDraft((previous) => ({ ...previous, [language]: body.slice(0, start) + token + body.slice(end) }));
    requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const addTemplate = () => {
    const id = `custom_${Date.now().toString(36)}`;
    wa.saveTemplate({ id, name: "New message", kind: "marketing", hi: "Namaste {first_name} ji 🙏\n", en: "Hello {first_name} 🙏\n" });
    setSelectedId(id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_22rem] lg:items-start">
      <div className="hidden lg:block">
        <TemplateList templates={templates} selectedId={draft.id} onSelect={setSelectedId} onAdd={addTemplate} />
      </div>
      <div className="flex gap-2 lg:hidden">
        <Select value={draft.id} onValueChange={setSelectedId}>
          <SelectTrigger className="h-10 flex-1 rounded-xl bg-surface" aria-label="Template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="press h-10" onClick={addTemplate} aria-label="New template">
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <section className="space-y-4 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
        <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name" className="text-xs font-semibold text-muted-foreground">
              Name
            </Label>
            <Input id="tpl-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-kind" className="text-xs font-semibold text-muted-foreground">
              Kind
            </Label>
            <Select value={draft.kind} onValueChange={(kind) => setDraft({ ...draft, kind })} disabled={isDefaultTemplate(draft.id)}>
              <SelectTrigger id="tpl-kind" className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KINDS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="-mt-1 text-xs text-muted-foreground">
          {KINDS[draft.kind]?.transactional
            ? "Sent to anyone with a phone number."
            : "An offer: only goes to customers who said yes, within the monthly limit."}
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="tpl-body" className="eyebrow text-[11px]">
              Message
            </Label>
            <Segmented label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
          </div>
          <textarea
            id="tpl-body"
            ref={textRef}
            value={body}
            onChange={(event) => setDraft({ ...draft, [language]: event.target.value })}
            rows={8}
            className="w-full rounded-xl border-[1.5px] border-input bg-surface-elevated px-3 py-2 font-mono text-[13px] leading-relaxed focus-visible:border-rani"
          />
          <div className="flex flex-wrap gap-1">
            {BLANKS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                title={label}
                onClick={() => insert(key)}
                className="press rounded-md bg-indigo/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-indigo hover:bg-indigo/20"
              >
                {`{${key}}`}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a blank to insert it. A line whose blank is empty (no pay link, no channel) is left out. *bold* and _italic_ work in WhatsApp.
          </p>
          {unknown.length > 0 && (
            <p className="rounded-lg bg-marigold/15 px-2.5 py-1.5 text-xs text-warning">
              Not a blank: {unknown.map((key) => `{${key}}`).join(", ")}. It will be sent as typed.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="rani" className="press" disabled={!dirty || !draft.name.trim()} onClick={() => wa.saveTemplate(draft)}>
            Save template
          </Button>
          {dirty && (
            <Button variant="ghost" className="press" onClick={() => setDraft({ ...saved })}>
              Discard changes
            </Button>
          )}
          {changedFromDefault && !dirty && (
            <Button variant="ghost" className="press" onClick={() => wa.dropTemplate(draft.id)}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Back to default
            </Button>
          )}
          {!original && (
            <Button
              variant="ghost"
              className="press ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (!window.confirm(`Delete "${saved.name}"?`)) return;
                wa.dropTemplate(draft.id);
                setSelectedId(templates[0].id);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </Button>
          )}
        </div>
      </section>

      <aside className="space-y-3 rounded-2xl bg-surface-elevated p-4 lg:sticky lg:top-0">
        <div className="space-y-1.5">
          <Label htmlFor="tpl-preview" className="eyebrow text-[11px]">
            Preview for
          </Label>
          <Select value={customer?.key ?? ""} onValueChange={setPreviewKey} disabled={sampleCustomers.length === 0}>
            <SelectTrigger id="tpl-preview" className="h-9 rounded-xl bg-surface">
              <SelectValue placeholder="No customers yet" />
            </SelectTrigger>
            <SelectContent>
              {sampleCustomers.map((entry) => (
                <SelectItem key={entry.key} value={entry.key}>
                  {entry.name}
                  {entry.due > 0 ? ` · owes ${formatRupees(entry.due)}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-2xl bg-[#efe7dd] p-3">
          <MessageBubble text={preview} className="ml-6" />
        </div>
        {!setup?.payLinks && body.includes("{pay_link}") && (
          <p className="text-xs text-muted-foreground">The pay link line shows once docs/schema/whatsapp_outbox.sql is run.</p>
        )}
        {!settings.wa_channel && body.includes("{channel_link}") && (
          <p className="text-xs text-muted-foreground">Add the channel link under Rules to show the channel line.</p>
        )}
      </aside>
    </div>
  );
}
