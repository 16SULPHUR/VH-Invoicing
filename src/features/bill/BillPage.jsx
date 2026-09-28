import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Loader2, Megaphone, MessageCircle, Share2, Smartphone } from "lucide-react";
import { BUSINESS } from "@/config/business";
import { billLinkService } from "@/services/billLinkService";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { formatRupees, toNumber } from "@/utils/formatters";
import { lineAmount, parseInvoiceLines } from "@/utils/invoice";
import { upiIntent } from "@/features/whatsapp/lib/upiIntent";
import { greetingName } from "@/features/whatsapp/lib/templates";
import { CopyUpiId, Notice, Shell } from "@/features/whatsapp/pay/PublicShell";

const CODE = /^[A-Za-z0-9]{8,32}$/;
const METHOD = { cash: "Cash", upi: "UPI" };
const isHttps = (link) => /^https:\/\//.test(link ?? "");

function PayCard({ shopName, upiId, bill, customerDue, dueBills }) {
  const due = toNumber(bill.credit);
  const hasOthers = customerDue > due;
  const [scope, setScope] = useState("bill");
  const amount = scope === "all" ? customerDue : due;

  if (!upiId) return <Notice title={`${formatRupees(due)} due`}>Please pay at the shop.</Notice>;

  const intent = upiIntent({
    upiId,
    payee: shopName,
    amount,
    note: (scope === "all" ? `${shopName} dues` : `${shopName} bill ${bill.id}`).slice(0, 60),
  });

  return (
    <section className="flex flex-col items-center gap-3 rounded-3xl bg-surface p-5 shadow-[0_1px_0_hsl(var(--border))]">
      {hasOthers && (
        <div
          className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-bold"
          role="radiogroup"
        >
          {[
            ["bill", "This bill", due],
            ["all", `All ${dueBills} bills`, customerDue],
          ].map(([value, label, sum]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={scope === value}
              onClick={() => setScope(value)}
              className={`press rounded-xl px-3 py-2 ${scope === value ? "bg-rani text-white" : "text-muted-foreground"}`}
            >
              {label}
              <span className="block font-display text-base tabular-nums">{formatRupees(sum)}</span>
            </button>
          ))}
        </div>
      )}
      <div className="paper rounded-2xl p-3">
        <QRCodeSVG value={intent} size={200} marginSize={1} />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Scan with any UPI app, or tap below on this phone.
      </p>
      <a
        href={intent}
        className="press flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-leaf font-display text-lg font-extrabold text-white shadow-[0_4px_0_hsl(154_63%_22%)] active:translate-y-[3px] active:shadow-[0_1px_0_hsl(154_63%_22%)]"
      >
        <Smartphone className="h-5 w-5" aria-hidden /> Pay {formatRupees(amount)} by UPI
      </a>
      <CopyUpiId upiId={upiId} />
      <p className="text-center text-xs text-muted-foreground">
        Paid already? It shows here once the shop records it.
      </p>
    </section>
  );
}

function Receipt({ bill, payments }) {
  const lines = parseInvoiceLines(bill.products);
  const later = payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0);
  const rows = [
    ["Cash", toNumber(bill.cash)],
    ["UPI", toNumber(bill.upi)],
    ...payments.map((payment) => [
      `${METHOD[payment.method] ?? "Paid"} on ${formatDateDDMMMYYYY(payment.paid_on)}`,
      toNumber(payment.amount),
    ]),
  ].filter(([, amount]) => amount > 0);
  const due = toNumber(bill.credit);

  return (
    <section className="paper overflow-hidden rounded-2xl shadow-[0_1px_0_hsl(var(--border))]">
      <ul className="divide-y divide-dashed divide-border px-4">
        {lines.map((line, index) => (
          <li key={index} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block font-semibold">{line.name || "Item"}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {toNumber(line.quantity)} × {formatRupees(line.price)}
              </span>
            </span>
            <span className="font-bold tabular-nums">{formatRupees(lineAmount(line))}</span>
          </li>
        ))}
      </ul>
      <div className="mx-4 flex items-baseline justify-between border-t-2 border-foreground py-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.12em]">Total</span>
        <span className="font-display text-3xl font-extrabold tabular-nums">
          {formatRupees(bill.total)}
        </span>
      </div>
      {(rows.length > 0 || due > 0) && (
        <dl className="space-y-1 bg-secondary/60 px-4 py-3 text-sm">
          {rows.map(([label, amount]) => (
            <div key={label} className="flex justify-between">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-semibold tabular-nums">{formatRupees(amount)}</dd>
            </div>
          ))}
          {due > 0 && (
            <div className="flex justify-between font-bold text-rani">
              <dt>{later > 0 ? "Still due" : "Due"}</dt>
              <dd className="tabular-nums">{formatRupees(due)}</dd>
            </div>
          )}
        </dl>
      )}
      {bill.note && <p className="px-4 py-3 text-sm text-muted-foreground">{bill.note}</p>}
    </section>
  );
}

function Actions({ bill, shop, shopName }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const { buildInvoicePdf } = await import("@/features/invoicing/hooks/useInvoiceSharing");
      const { pdf, fileName } = await buildInvoicePdf({
        id: bill.id,
        date: bill.date,
        customerName: bill.customer_name,
        customerNumber: bill.phone_last4 ? `••••••${bill.phone_last4}` : "",
        products: bill.products,
        total: bill.total,
        cash: bill.cash,
        upi: bill.upi,
        credit: bill.credit,
        note: bill.note,
      });
      pdf.save(fileName);
    } finally {
      setBusy(false);
    }
  };

  const share = () =>
    navigator
      .share?.({ title: `${shopName} bill #${bill.id}`, url: window.location.href })
      .catch(() => {});

  const button =
    "press flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-bold shadow-[0_1px_0_hsl(var(--border))]";
  return (
    <section className="grid grid-cols-2 gap-2">
      <button type="button" onClick={download} disabled={busy} className={button}>
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        PDF
      </button>
      {typeof navigator.share === "function" && (
        <button type="button" onClick={share} className={button}>
          <Share2 className="h-4 w-4" aria-hidden /> Share
        </button>
      )}
      {isHttps(shop.whatsapp) && (
        <a href={shop.whatsapp} className={`${button} text-leaf`}>
          <MessageCircle className="h-4 w-4" aria-hidden /> Message shop
        </a>
      )}
      {isHttps(shop.wa_channel) && (
        <a href={shop.wa_channel} className={button}>
          <Megaphone className="h-4 w-4" aria-hidden /> New designs
        </a>
      )}
    </section>
  );
}

/** Public: one bill, opened from the link sent with it. Credit bills show how to pay. */
export default function BillPage() {
  const code = decodeURIComponent(window.location.pathname.split("/")[2] ?? "");
  const [state, setState] = useState(() =>
    CODE.test(code) ? { status: "loading" } : { status: "missing" }
  );

  useEffect(() => {
    if (!CODE.test(code)) return;
    billLinkService.getPublicBill(code).then(
      (page) => setState(page?.bill ? { status: "ready", page } : { status: "missing" }),
      () => setState({ status: "error" })
    );
  }, [code]);

  const page = state.page;
  const shop = page?.shop ?? {};
  const shopName = shop.shop_name || BUSINESS.displayName;

  useEffect(() => {
    document.title = page?.bill ? `Bill #${page.bill.id} · ${shopName}` : shopName;
  }, [page, shopName]);

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
        <Notice title="Bill not found">
          Please check the link, or ask the shop to send it again.
        </Notice>
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

  const { bill } = page;
  const due = toNumber(bill.credit);
  const name = greetingName(bill.customer_name).split(" ")[0];

  return (
    <Shell shopName={shopName}>
      <section className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-muted-foreground">
            {name ? `Namaste ${name} ji 🙏` : "Namaste 🙏"}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Bill #{bill.id}</h1>
          <p className="text-sm text-muted-foreground">{formatDateDDMMMYYYY(bill.date)}</p>
        </div>
        {due > 0 ? (
          <div className="text-right">
            <p className="eyebrow">Due</p>
            <p className="font-display text-4xl font-extrabold tabular-nums leading-none text-rani">
              {formatRupees(due)}
            </p>
          </div>
        ) : (
          <span className="-rotate-6 rounded-xl border-[3px] border-leaf px-3 py-0.5 font-display text-2xl font-extrabold tracking-[0.12em] text-leaf">
            PAID
          </span>
        )}
      </section>

      {due > 0 && (
        <PayCard
          shopName={shopName}
          upiId={shop.upi_id || BUSINESS.upiId}
          bill={bill}
          customerDue={toNumber(page.customer_due)}
          dueBills={toNumber(page.due_bills)}
        />
      )}

      <Receipt bill={bill} payments={page.payments ?? []} />
      <Actions bill={bill} shop={shop} shopName={shopName} />

      <p className="pt-2 text-center text-sm font-semibold text-muted-foreground">
        Thank you for shopping with {shopName}!
      </p>
    </Shell>
  );
}
