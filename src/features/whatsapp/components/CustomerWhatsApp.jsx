import { useMemo } from "react";
import { Bell, BellOff, MessageCircle } from "lucide-react";
import { customerKey, daysSince, phoneDigits } from "@/features/customers/lib/customerKey";
import { appOrigin } from "../lib/rules";
import { duesTemplateId, messageVars, renderTemplate } from "../lib/templates";
import { waTarget, waUrl } from "../lib/waLink";
import { useCustomerConsent, usePayLinks, useSetOffers, useWaLog, useWhatsAppSettings, useWhatsAppSetup } from "../hooks/useWhatsApp";

const ago = (date) => (daysSince(date) === 0 ? "today" : `${daysSince(date)}d ago`);
const pill = "press inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold";

/** The escalating dues reminder for one customer, with a pay link once the SQL is run. */
export function DuesReminderLink({ name, phone, creditBills }) {
  const { templates, settings, rules } = useWhatsAppSettings();
  const setup = useWhatsAppSetup();
  const log = useWaLog();
  const key = customerKey({ name, phone });
  const entry = useMemo(() => {
    const dueBills = [...creditBills]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map(({ id, date, credit }) => ({ id, date, credit: Number(credit) || 0 }));
    return {
      key,
      name,
      phone: phoneDigits(phone),
      due: dueBills.reduce((sum, bill) => sum + bill.credit, 0),
      dueBills,
      oldestDays: dueBills.length ? daysSince(dueBills[0].date) : 0,
    };
  }, [key, name, phone, creditBills]);
  const payKeys = useMemo(() => [key], [key]);
  const { tokens, isLoading } = usePayLinks(payKeys, rules.payLinkDays, Boolean(setup?.payLinks) && entry.due > 0);

  const template = templates.find(({ id }) => id === duesTemplateId(entry.oldestDays, rules));
  const token = tokens?.get(key);
  const text = renderTemplate(
    template?.[rules.language] || template?.hi,
    messageVars(entry, { settings, payLink: token ? `${appOrigin(rules)}/pay/${token}` : "" })
  );
  const last = (log.byKey.get(key) ?? []).find((item) => item.status === "sent" && item.kind === "dues");

  return (
    <a
      href={waUrl(entry.phone, text, rules.opener)}
      target={waTarget(rules.opener)}
      rel="noopener noreferrer"
      aria-disabled={isLoading}
      onClick={(event) => {
        if (isLoading) return event.preventDefault();
        log.record({ customer: entry, template: template?.id ?? null, kind: "dues", campaign: null, text });
      }}
      className={`${pill} bg-leaf text-white hover:brightness-110 aria-disabled:opacity-60`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden /> Send reminder
      {last && <span className="font-semibold opacity-80">· sent {ago(last.created_at)}</span>}
    </a>
  );
}

/** Allow or stop offers on WhatsApp for one customer. */
export function OffersPill({ name, phone }) {
  const customer = useMemo(() => ({ name, phone }), [name, phone]);
  const consent = useCustomerConsent(customer);
  const setOffers = useSetOffers();
  if (!consent) return null;
  const Icon = consent.optin ? Bell : BellOff;

  return (
    <button
      type="button"
      disabled={setOffers.isPending}
      onClick={() => {
        if (consent.optin && !window.confirm(`Stop offers on WhatsApp for ${name}?`)) return;
        setOffers.mutate({ customer: { id: consent.recordId, name, phone }, allow: !consent.optin });
      }}
      aria-pressed={consent.optin}
      className={`${pill} bg-white/10 hover:bg-white/20`}
    >
      <Icon className="h-4 w-4" aria-hidden /> {consent.optin ? "Offers on" : "Offers off"}
    </button>
  );
}
