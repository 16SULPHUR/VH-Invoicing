import { CheckCircle2, CircleDashed } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DEFAULT_RULES, RULE_FIELDS } from "@/features/whatsapp/lib/rules";
import { LANGUAGES } from "@/features/whatsapp/lib/templates";
import { useWhatsAppSettings, useWhatsAppSetup } from "@/features/whatsapp/hooks/useWhatsApp";
import { CommitInput, Section, StoredBadge } from "../components/fields";

const OPENERS = [
  { value: "wa.me", label: "wa.me (asks which app)" },
  { value: "web", label: "WhatsApp Web, one tab" },
  { value: "app", label: "WhatsApp desktop app" },
];

function Status({ ready, children }) {
  const Icon = ready ? CheckCircle2 : CircleDashed;
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ready ? "text-success" : "text-warning"}`} aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function WhatsAppSection() {
  const wa = useWhatsAppSettings();
  const { rules } = wa;
  const setup = useWhatsAppSetup();

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Section title="Sending rules" aside={<StoredBadge stored={wa.stored} />}>
        <div className="grid grid-cols-2 gap-3">
          {RULE_FIELDS.map(({ key, label, min, max }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`rule-${key}`} className="text-xs font-semibold text-muted-foreground">
                {label}
              </Label>
              <CommitInput
                id={`rule-${key}`}
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={rules[key]}
                onCommit={(value) => wa.saveRules({ [key]: Number(value) || DEFAULT_RULES[key] })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="rule-language" className="text-xs font-semibold text-muted-foreground">
              Default language
            </Label>
            <Select value={rules.language} onValueChange={(language) => wa.saveRules({ language })}>
              <SelectTrigger id="rule-language" className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Dues reminders skip anyone reminded in the last {rules.duesGapDays} days and turn firm from {rules.firmAfterDays} days, final after{" "}
          {rules.finalAfterDays}. Each customer gets at most {rules.offersPerMonth} offers in 30 days.
        </p>
      </Section>

      <Section title="Links and contacts">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rule-opener" className="text-xs font-semibold text-muted-foreground">
              On a computer, open
            </Label>
            <Select value={rules.opener} onValueChange={(opener) => wa.saveRules({ opener })}>
              <SelectTrigger id="rule-opener" className="h-9 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENERS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Phones always open the WhatsApp app.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-prefix" className="text-xs font-semibold text-muted-foreground">
              Contact name starts with
            </Label>
            <CommitInput id="rule-prefix" value={rules.contactPrefix} onCommit={(contactPrefix) => wa.saveRules({ contactPrefix })} />
            <p className="text-[11px] text-muted-foreground">e.g. “{rules.contactPrefix}Priya Shah”</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="rule-app-url" className="text-xs font-semibold text-muted-foreground">
              App address for pay links
            </Label>
            <CommitInput
              id="rule-app-url"
              value={rules.appUrl}
              placeholder={window.location.origin}
              onCommit={(appUrl) => wa.saveRules({ appUrl: appUrl.trim() })}
            />
            <p className="text-[11px] text-muted-foreground">Leave empty to use this address.</p>
          </div>
        </div>
      </Section>

      <Section title="Database">
        {setup ? (
          <ul className="space-y-1.5">
            <Status ready={setup.log}>{setup.log ? "Send log is saved in Supabase." : "Send log is kept on this device."}</Status>
            <Status ready={setup.payLinks}>{setup.payLinks ? "Pay-now links are on." : "Pay-now links are off."}</Status>
            <Status ready={setup.consent}>
              {setup.consent ? "Offer consent and birthdays are saved with customers." : "Offer consent and birthdays are kept on this device."}
            </Status>
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Checking…</p>
        )}
        {setup && !(setup.log && setup.payLinks && setup.consent) && (
          <p className="rounded-lg bg-marigold/15 px-3 py-2 text-xs text-warning">
            Run docs/schema/whatsapp_outbox.sql in the Supabase SQL editor to switch these on. Anything saved on this device moves up after.
          </p>
        )}
      </Section>
    </div>
  );
}
