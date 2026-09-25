import { useMemo, useState } from "react";
import { audienceById, holdReason } from "../lib/audiences";
import { appOrigin } from "../lib/rules";
import { duesTemplateId, messageVars, renderTemplate } from "../lib/templates";
import { URL_SOFT_LIMIT, waUrl } from "../lib/waLink";
import {
  useCustomerDirectory,
  useKeywordKeys,
  usePayLinks,
  useWaLog,
  useWhatsAppSettings,
  useWhatsAppSetup,
} from "./useWhatsApp";

const NO_EDITS = Object.freeze({});
const bodyOf = (template, language) => template?.[language] || template?.hi || "";

/**
 * The messages lined up for one audience and template: personalised text, a wa.me link,
 * and whether each customer is ready, held back (and why), sent or skipped this round.
 */
export function useOutboxQueue({ audienceId, templateId, language, optedInOnly, campaign, keyword, keywordDays }) {
  const wa = useWhatsAppSettings();
  const setup = useWhatsAppSetup();
  const { directory, isLoading } = useCustomerDirectory();
  const log = useWaLog();
  const [sessionIds, setSessionIds] = useState(() => new Set());
  const signature = `${audienceId}|${templateId}|${language}`;
  const [editState, setEditState] = useState({ signature, map: {} });
  const edits = editState.signature === signature ? editState.map : NO_EDITS;
  const setEdits = (update) =>
    setEditState((previous) => ({ signature, map: update(previous.signature === signature ? previous.map : {}) }));

  const audience = audienceById(audienceId);
  const keywordAudience = useKeywordKeys(keyword, keywordDays, audienceId === "keyword");
  const members = useMemo(
    () => audience.pick(directory, { keywordKeys: keywordAudience.keys }),
    [audience, directory, keywordAudience.keys]
  );

  const templatesById = useMemo(() => new Map(wa.templates.map((template) => [template.id, template])), [wa.templates]);
  const auto = templateId === "auto";
  const chosen = templatesById.get(templateId);
  const kind = auto ? "dues" : chosen?.kind ?? "marketing";
  const campaignKey = kind === "dues" ? null : campaign.trim() || null;

  const base = useMemo(
    () =>
      members.map((entry) => {
        const template = auto ? templatesById.get(duesTemplateId(entry.oldestDays, wa.rules)) : chosen;
        const history = log.byKey.get(entry.key) ?? [];
        const sameSend = (item) => (kind === "dues" ? item.kind === "dues" : item.campaign === campaignKey);
        const done = history.find((item) => sessionIds.has(item.id) && sameSend(item));
        const reason = done ? null : holdReason(entry, { kind, campaign: campaignKey, rules: wa.rules, history, optedInOnly });
        return { entry, template, done, reason, lastSent: history.find((item) => item.status === "sent") };
      }),
    [members, auto, templatesById, chosen, wa.rules, log.byKey, kind, campaignKey, sessionIds, optedInOnly]
  );

  const payKeys = useMemo(
    () =>
      base
        .filter(({ entry, reason, template }) => !reason && entry.due > 0 && bodyOf(template, language).includes("{pay_link}"))
        .map(({ entry }) => entry.key),
    [base, language]
  );
  const payLinks = usePayLinks(payKeys, wa.rules.payLinkDays, Boolean(setup?.payLinks));
  const origin = appOrigin(wa.rules);

  const rows = useMemo(
    () =>
      base.map(({ entry, template, done, reason, lastSent }) => {
        const token = payLinks.tokens?.get(entry.key);
        const vars = messageVars(entry, { settings: wa.settings, payLink: token ? `${origin}/pay/${token}` : "" });
        const text = edits[entry.key] ?? renderTemplate(bodyOf(template, language), vars);
        const url = waUrl(entry.phone, text, wa.rules.opener);
        return {
          key: entry.key,
          entry,
          template,
          text,
          edited: entry.key in edits,
          url,
          tooLong: url.length > URL_SOFT_LIMIT,
          status: done ? done.status : reason ? "held" : "ready",
          reason,
          logId: done?.id ?? null,
          lastSent,
        };
      }),
    [base, payLinks.tokens, wa.settings, origin, edits, wa.rules.opener, language]
  );

  const mark = (row, status) => {
    const entry = log.record({
      customer: row.entry,
      template: row.template?.id ?? null,
      kind,
      campaign: campaignKey,
      text: status === "sent" ? row.text : null,
      status,
    });
    setSessionIds((previous) => new Set(previous).add(entry.id));
  };

  return {
    rows,
    kind,
    audience,
    campaignKey,
    isLoading: isLoading || (audienceId === "keyword" && keywordAudience.isLoading),
    payLinksLoading: payLinks.isLoading,
    payLinksReady: Boolean(setup?.payLinks),
    logStored: log.stored,
    wa,
    setup,
    markSent: (row) => mark(row, "sent"),
    markSkipped: (row) => mark(row, "skipped"),
    undo: (row) => {
      if (row.logId) log.undo(row.logId);
      setSessionIds((previous) => {
        const next = new Set(previous);
        next.delete(row.logId);
        return next;
      });
    },
    editText: (row, text) => setEdits((previous) => ({ ...previous, [row.key]: text })),
    resetText: (row) =>
      setEdits((previous) => {
        const next = { ...previous };
        delete next[row.key];
        return next;
      }),
  };
}
