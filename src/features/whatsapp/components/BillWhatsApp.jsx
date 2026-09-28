import { useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { invoiceCustomerKey, phoneDigits } from "@/features/customers/lib/customerKey";
import { buildInvoicePdf } from "@/features/invoicing/hooks/useInvoiceSharing";
import { messageVars, renderTemplate } from "../lib/templates";
import { isPhone, waTarget, waUrl } from "../lib/waLink";
import { useCustomerConsent, useSetOffers, useWaLog, useWhatsAppSettings } from "../hooks/useWhatsApp";

const PDF_PROBE = () => new File([""], "bill.pdf", { type: "application/pdf" });

function canShareFiles() {
  try {
    return isPhone() && Boolean(navigator.canShare?.({ files: [PDF_PROBE()] }));
  } catch {
    return false;
  }
}

function billCustomer(invoice) {
  return {
    key: invoiceCustomerKey(invoice),
    name: invoice.customerName,
    phone: phoneDigits(invoice.customerNumber),
    due: 0,
    dueBills: [],
  };
}

/**
 * Sends a bill on WhatsApp with the thank-you message. Phones that can share files get the
 * PDF through the share sheet; everything else opens the customer's chat with the text.
 */
export function BillWhatsAppButton({ invoice, compact = false, className = "" }) {
  const { toast } = useToast();
  const { templates, settings, rules } = useWhatsAppSettings();
  const log = useWaLog();
  const [prepared, setPrepared] = useState(null);
  const [busy, setBusy] = useState(false);
  const shareFiles = useMemo(canShareFiles, []);

  const customer = billCustomer(invoice);
  const template = templates.find(({ id }) => id === "thanks");
  const bill = { id: invoice.id, date: invoice.date, total: Number(invoice.total) || 0 };
  const text = renderTemplate(template?.[rules.language] || template?.hi, messageVars(customer, { settings, bill }));
  const record = () => log.record({ customer, template: "thanks", kind: "thanks", campaign: `bill:${invoice.id}`, text });

  const label = busy ? "Making PDF…" : prepared ? "Send PDF" : "WhatsApp";
  const classes = compact
    ? cn("press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-leaf hover:bg-leaf/10", className)
    : cn(
        "press inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60",
        className
      );
  const icon = busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageCircle className="h-4 w-4" aria-hidden />;

  if (!shareFiles) {
    return (
      <a
        href={waUrl(customer.phone, text, rules.opener)}
        target={waTarget(rules.opener)}
        rel="noopener noreferrer"
        onClick={record}
        className={classes}
        aria-label={compact ? `WhatsApp bill ${invoice.id}` : undefined}
        title={compact ? "Send on WhatsApp" : undefined}
      >
        {icon}
        {!compact && "WhatsApp"}
      </a>
    );
  }

  const share = async (file) => {
    try {
      await navigator.share({ files: [file], text });
      setPrepared(null);
      record();
    } catch (error) {
      // Making the PDF can outlast the tap; a second tap shares the ready file.
      if (error.name === "NotAllowedError") setPrepared(file);
      else if (error.name !== "AbortError") toast({ title: "Couldn't share", description: error.message, variant: "destructive" });
    }
  };

  const handleClick = async () => {
    if (prepared) return share(prepared);
    navigator.clipboard?.writeText(text).catch(() => {});
    setBusy(true);
    try {
      const { file } = await buildInvoicePdf(invoice);
      setBusy(false);
      await share(file);
    } catch (error) {
      setBusy(false);
      toast({ title: "Couldn't make the PDF", description: error.message, variant: "destructive" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={classes}
      aria-label={compact ? `WhatsApp bill ${invoice.id}` : undefined}
      title={compact ? "Send on WhatsApp" : undefined}
    >
      {icon}
      {!compact && label}
    </button>
  );
}

/** "Offers on WhatsApp?" for the customer on a bill. Saving it never touches the bill. */
export function OffersSwitch({ name, phone, className = "" }) {
  const customer = useMemo(() => ({ name, phone }), [name, phone]);
  const consent = useCustomerConsent(customer);
  const setOffers = useSetOffers();
  if (phoneDigits(phone).length !== 10 || !consent) return null;

  return (
    <label className={cn("flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm", className)}>
      <span>
        <span className="block font-semibold">Offers on WhatsApp?</span>
        <span className="block text-xs text-muted-foreground">
          {consent.optin ? "Yes, new arrivals and festival offers" : consent.optoutAt ? "Said no" : "Ask the customer"}
        </span>
      </span>
      <Switch
        checked={consent.optin}
        disabled={setOffers.isPending}
        onCheckedChange={(allow) => setOffers.mutate({ customer: { id: consent.recordId, name, phone }, allow })}
      />
    </label>
  );
}
