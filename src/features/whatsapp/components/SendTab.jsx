import { useEffect, useMemo, useState } from "react";
import { LinkIcon } from "lucide-react";
import { PageLoader } from "@/components/common/PageLoader";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/use-toast";
import { toISODate } from "@/utils/date";
import { audienceById } from "../lib/audiences";
import { downloadVcf, toVcf } from "../lib/vcard";
import { waNumber } from "../lib/waLink";
import { useOutboxQueue } from "../hooks/useOutboxQueue";
import { useSetOffers } from "../hooks/useWhatsApp";
import { AudiencePanel, AudienceSummary, Segmented } from "./AudiencePanel";
import { Queue } from "./Queue";

const MODES = [
  { value: "focus", label: "One by one" },
  { value: "list", label: "List" },
];

function defaultCampaign(template) {
  if (!template) return "";
  const now = new Date();
  if (template.id === "birthday" || template.id === "anniversary") return `${template.name} ${now.getFullYear()}`;
  return `${template.name} · ${now.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
}

export function SendTab({ wa }) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const setOffers = useSetOffers();
  const [mode, setMode] = useState(isMobile ? "focus" : "list");
  const [setupOpen, setSetupOpen] = useState(false);
  const [form, setFormState] = useState(() => ({
    audienceId: "dues",
    templateId: "auto",
    language: wa.rules.language,
    optedInOnly: false,
    campaign: "",
    keyword: "saree",
    keywordDays: 180,
  }));

  const setForm = (changes) =>
    setFormState((previous) => {
      const next = { ...previous, ...changes };
      if (changes.audienceId && changes.audienceId !== previous.audienceId) {
        next.templateId = audienceById(changes.audienceId).template;
      }
      if (next.templateId !== previous.templateId) {
        next.campaign = defaultCampaign(wa.templates.find(({ id }) => id === next.templateId));
      }
      return next;
    });

  useEffect(() => setFormState((previous) => ({ ...previous, language: wa.rules.language })), [wa.rules.language]);

  const queue = useOutboxQueue(form);

  const contacts = useMemo(
    () =>
      queue.rows
        .filter(({ entry, reason }) => waNumber(entry.phone) && !["Stopped offers", "Hasn't said yes to offers"].includes(reason))
        .map(({ entry }) => entry),
    [queue.rows]
  );

  const exportContacts = () => {
    const { text, count } = toVcf(contacts, wa.rules.contactPrefix);
    downloadVcf(`vh-contacts-${queue.audience.id}-${toISODate()}.vcf`, text);
    toast({ title: `Saved ${count} contact${count === 1 ? "" : "s"}`, description: "Open the file on the shop phone to add them." });
  };

  const stopOffers = (row) => setOffers.mutate({ customer: { id: row.entry.recordId, name: row.entry.name, phone: row.entry.phone }, allow: false });

  const needsPayLink = queue.kind === "dues" && !queue.payLinksReady;

  return (
    <div className="grid gap-4 lg:grid-cols-[23rem_minmax(0,1fr)] lg:items-start">
      <div className="space-y-3 lg:sticky lg:top-0">
        {isMobile && !setupOpen ? (
          <AudienceSummary form={form} templates={wa.templates} onOpen={() => setSetupOpen(true)} />
        ) : (
          <AudiencePanel
            form={form}
            setForm={setForm}
            templates={wa.templates}
            kind={queue.kind}
            contactCount={contacts.length}
            onExportContacts={exportContacts}
            onDone={isMobile ? () => setSetupOpen(false) : undefined}
          />
        )}
        {needsPayLink && queue.setup && (
          <p className="flex gap-2 rounded-2xl bg-marigold/15 px-3.5 py-2.5 text-xs text-warning">
            <LinkIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Pay-now links need docs/schema/whatsapp_outbox.sql. Until then the pay link line is left out.
          </p>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow">Outbox</p>
          <Segmented label="Show" value={mode} options={MODES} onChange={setMode} />
        </div>
        {queue.isLoading ? (
          <PageLoader label="Lining up messages…" />
        ) : (
          <Queue
            queue={{ ...queue, templateId: form.templateId, opener: wa.rules.opener, waiting: queue.payLinksLoading }}
            mode={mode}
            onStopOffers={stopOffers}
          />
        )}
      </div>
    </div>
  );
}
