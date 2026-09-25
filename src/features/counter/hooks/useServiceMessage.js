import { useCallback } from "react";
import { useWaLog, useWhatsAppSettings } from "@/features/whatsapp/hooks/useWhatsApp";
import { waTarget, waUrl } from "@/features/whatsapp/lib/waLink";
import { serviceMessage } from "../lib/messages";

/**
 * Builds a counter message (ready for pickup, approval reminder) with the outbox's language,
 * opener and shop values, and logs it to the shared WhatsApp log as a transactional message.
 */
export function useServiceMessage() {
  const { settings, rules } = useWhatsAppSettings();
  const log = useWaLog();

  const build = useCallback(
    (templateId, record, vars) => {
      const message = serviceMessage(templateId, record, { settings, language: rules.language, vars });
      return {
        ...message,
        canSend: message.customer.phone.length === 10,
        href: waUrl(message.customer.phone, message.text, rules.opener),
        target: waTarget(rules.opener),
      };
    },
    [settings, rules.language, rules.opener]
  );

  const record = useCallback(
    (message, templateId, campaign) =>
      log.record({ customer: message.customer, template: templateId, kind: "thanks", campaign, text: message.text }),
    [log]
  );

  const lastSent = useCallback(
    (key, campaign) => (log.byKey.get(key) ?? []).find((entry) => entry.status === "sent" && entry.campaign === campaign),
    [log.byKey]
  );

  return { build, record, lastSent };
}
