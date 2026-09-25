import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { BUSINESS } from "@/config/business";
import { payLinkService } from "@/services/payLinkService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees } from "@/utils/formatters";
import { upiIntent } from "../lib/upiIntent";

const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Shell({ shopName, children }) {
  const [first, ...rest] = (shopName || BUSINESS.displayName).split(" ");
  return (
    <div className="min-h-dvh bg-background">
      <header className="motif-overlay relative bg-indigo px-5 pb-6 pt-7 text-white">
        <p className="relative mx-auto max-w-md font-display text-[28px] font-extrabold leading-[0.95] tracking-tight">
          {first}
          {rest.length > 0 && <span className="block text-marigold">{rest.join(" ")}</span>}
        </p>
        <div className="motif-band absolute inset-x-0 -bottom-2.5 h-2.5" aria-hidden />
      </header>
      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-8">{children}</main>
    </div>
  );
}

function Notice({ title, children }) {
  return (
    <div className="rounded-2xl bg-surface p-5 text-center shadow-[0_1px_0_hsl(var(--border))]">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

function CopyUpiId({ upiId }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(upiId).then(
          () => setCopied(true),
          () => setCopied(false)
        )
      }
      className="press inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs font-semibold"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {upiId}
    </button>
  );
}

/** Public: what one customer owes and a UPI QR for it. Opened from a WhatsApp reminder. */
export default function PayPage() {
  const token = decodeURIComponent(window.location.pathname.split("/")[2] ?? "");
  const [state, setState] = useState(() => (TOKEN.test(token) ? { status: "loading" } : { status: "missing" }));

  useEffect(() => {
    document.title = `Pay ${BUSINESS.displayName}`;
    if (!TOKEN.test(token)) return;
    payLinkService.getPage(token).then(
      (page) => setState(page ? { status: "ready", page } : { status: "missing" }),
      () => setState({ status: "error" })
    );
  }, [token]);

  const page = state.page;
  const shopName = page?.shop_name || BUSINESS.displayName;

  if (state.status === "loading") {
    return (
      <Shell>
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
        </div>
      </Shell>
    );
  }
  if (state.status === "missing") {
    return (
      <Shell>
        <Notice title="Link not found">Please check the link, or ask the shop to send it again.</Notice>
      </Shell>
    );
  }
  if (state.status === "error") {
    return (
      <Shell>
        <Notice title="Couldn't load">Please check your internet and open the link again.</Notice>
      </Shell>
    );
  }
  if (page.expired) {
    return (
      <Shell shopName={shopName}>
        <Notice title="This link has expired">Ask {shopName} to send a new one.</Notice>
      </Shell>
    );
  }

  const greeting = page.first_name ? `Namaste ${page.first_name} ji` : "Namaste";
  const total = Number(page.total_due) || 0;
  const bills = page.bills ?? [];
  const upiId = page.upi_id || BUSINESS.upiId;

  if (total <= 0) {
    return (
      <Shell shopName={shopName}>
        <Notice title={`${greeting} 🙏`}>Nothing is due. Thank you for shopping with {shopName}!</Notice>
      </Shell>
    );
  }

  const intent = upiId
    ? upiIntent({
        upiId,
        payee: shopName,
        amount: total,
        note: `${shopName} bill${bills.length === 1 ? "" : "s"} ${bills.map(({ bill_no }) => bill_no).join(",")}`.slice(0, 60),
      })
    : null;

  return (
    <Shell shopName={shopName}>
      <section className="text-center">
        <p className="text-[15px] font-semibold text-muted-foreground">{greeting} 🙏</p>
        <p className="eyebrow mt-4">Total due</p>
        <p className="font-display text-5xl font-extrabold tabular-nums leading-tight tracking-tight text-rani">{formatRupees(total)}</p>
      </section>

      {intent ? (
        <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-5 shadow-[0_1px_0_hsl(var(--border))]">
          <div className="paper rounded-2xl p-3">
            <QRCodeSVG value={intent} size={208} marginSize={1} />
          </div>
          <p className="text-center text-xs text-muted-foreground">Scan with any UPI app, or tap below on this phone.</p>
          <a
            href={intent}
            className="press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-leaf font-display text-lg font-extrabold text-white shadow-[0_4px_0_hsl(154_63%_22%)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(154_63%_22%)]"
          >
            <Smartphone className="h-5 w-5" aria-hidden /> Pay {formatRupees(total)} by UPI
          </a>
          <CopyUpiId upiId={upiId} />
        </section>
      ) : (
        <Notice title="UPI not set up">Please pay at the shop.</Notice>
      )}

      <section className="rounded-2xl bg-surface shadow-[0_1px_0_hsl(var(--border))]">
        <h2 className="px-4 pb-1 pt-3 text-base font-extrabold">
          {bills.length} bill{bills.length === 1 ? "" : "s"} pending
        </h2>
        <ul className="divide-y divide-dashed divide-border">
          {bills.map((bill) => (
            <li key={`${bill.bill_no}-${bill.date}`} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
              <span>
                <b>#{bill.bill_no}</b> <span className="text-muted-foreground">· {formatDateDDMMMYYYY(bill.date)}</span>
              </span>
              <span className="font-bold tabular-nums">{formatRupees(bill.due)}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Paid already? It shows here once the shop records it.
        {page.whatsapp && /^https:\/\//.test(page.whatsapp) && (
          <a href={page.whatsapp} className="mt-2 flex items-center justify-center gap-1 font-bold text-leaf">
            <MessageCircle className="h-4 w-4" aria-hidden /> Message {shopName} on WhatsApp
          </a>
        )}
      </p>
    </Shell>
  );
}
