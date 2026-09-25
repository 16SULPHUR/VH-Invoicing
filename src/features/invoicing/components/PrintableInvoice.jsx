import { QRCodeSVG } from "qrcode.react";
import { toNumber } from "@/utils/formatters";
import { upiLinkFor } from "../upi";
import { paginateBill, TALL_NAME_CHARS } from "../printLayout";

const SHOP = {
  address: "Shop no. 09, Sentosa Enclave, Near Ramipark Soc., Dindoli, Surat, Gujarat 394210",
  contacts: ["81601 85875", "79900 57097", "@varietyheaven.in", "GSTIN 24GGEPP0013E1ZZ"],
  terms: [
    "Goods once sold will not be taken back.",
    "Exchange timing is 4:00 PM to 6:00 PM.",
    "No guarantee for colour and zari quality.",
    "Goods should be returned within 4 days.",
    "Subject to Surat jurisdiction only.",
  ],
};

// Inlined because the bill is also rendered to a static string for the print window and PDF.
const STYLES = `
.vhb{--rani:#d6246e;--ink:#111;color:var(--ink);font-size:10px;line-height:1.3;font-family:"Hanken Grotesk Variable","Hanken Grotesk",Arial,sans-serif;font-variant-numeric:tabular-nums;display:grid;gap:6mm;justify-content:center}
.vhb *{box-sizing:border-box}
.vhb-page{width:148mm;height:210mm;background:#fff;display:flex;flex-direction:column;overflow:hidden;position:relative;break-after:page;page-break-after:always}
.vhb-page:last-child{break-after:auto;page-break-after:auto}
.vhb-border{height:7mm;flex:none;border-bottom:.5mm solid var(--ink);background:radial-gradient(circle at 3.5mm 3.5mm,var(--rani) 1mm,transparent 1.12mm) 0 0/7mm 7mm,radial-gradient(circle at 0 0,transparent 2.3mm,var(--ink) 2.4mm 2.85mm,transparent 2.95mm) 3.5mm 3.5mm/7mm 7mm}
.vhb-border.bot{border-bottom:0;border-top:.5mm solid var(--ink)}
.vhb-body{height:196mm;display:flex;flex-direction:column;gap:3mm;padding:5mm 9mm 4mm}
.vhb-body>*{flex:none;overflow:hidden}
.vhb-d{font-family:"Bricolage Grotesque Variable","Bricolage Grotesque","Hanken Grotesk Variable",Arial,sans-serif;letter-spacing:-.02em}
.vhb-cap{display:block;line-height:1.2;font-size:6.8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#555}
.vhb-brand{height:18mm;display:grid;justify-items:center;align-content:start;gap:1.5mm;text-align:center}
.vhb-brand img{width:58mm;height:9.6mm;object-fit:contain}
.vhb-brand p{margin:0;font-size:8.4px;line-height:1.45;color:#333}
.vhb-sep{margin:0 1.3mm;color:var(--rani)}
.vhb-title{height:3mm;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:3mm}
.vhb-title i{height:.35mm;background:var(--ink)}
.vhb-title span{font-size:9px;font-weight:800;letter-spacing:.38em;padding-left:.38em;line-height:1}
.vhb-meta{height:9.5mm;display:grid;grid-template-columns:1.35fr 1fr .8fr .8fr;border:.35mm solid var(--ink);border-radius:1.8mm}
.vhb-meta>div{padding:1.2mm 2.4mm;display:grid;align-content:center;gap:.3mm;min-width:0}
.vhb-meta>div+div{border-left:.35mm solid var(--ink)}
.vhb-meta b{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vhb-slim{height:9mm;display:flex;align-items:center;justify-content:space-between;gap:3mm;border-bottom:.35mm solid var(--ink)}
.vhb-slim img{height:5.5mm}
.vhb-slim div{text-align:right;font-size:9.5px;line-height:1.3}
.vhb-slim b{font-weight:800}
.vhb-cols{display:grid;grid-template-columns:6mm 1fr 10mm 20mm 22mm;align-items:center}
.vhb-cols>span{padding:0 1.5mm;min-width:0}
.vhb-cols>span:nth-child(n+3){text-align:right}
.vhb-thead{height:4.5mm;border-bottom:.45mm solid var(--ink);align-items:start}
.vhb-row{height:5.6mm;border-bottom:.2mm solid #ddd;font-size:10px;line-height:1.25}
.vhb-row.tall{height:8.6mm}
.vhb-row:nth-child(even of .vhb-row){background:#faf7fc}
.vhb-row .i{color:#888}
.vhb-row .nm{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vhb-row.tall .nm{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.vhb-row.bf{font-style:italic;color:#555;background:none}
.vhb-tfoot{height:5.5mm;display:flex;justify-content:space-between;align-items:center;padding:0 1.5mm;font-size:9.5px;color:#555}
.vhb-tfoot b{color:var(--ink)}
.vhb-settle{height:22mm;margin-top:auto;display:grid;grid-template-columns:1fr 50mm;gap:5mm;align-items:start;overflow:visible!important}
.vhb-split{display:grid;gap:1.3mm;align-content:start;min-width:0}
.vhb-chips{display:flex;gap:1.5mm;flex-wrap:wrap}
.vhb-chip{border:.3mm solid var(--ink);border-radius:99px;padding:.8mm 2.3mm;font-size:9.5px;font-weight:600;white-space:nowrap}
.vhb-chip b{font-weight:800}
.vhb-note{font-size:9px;line-height:1.4;border-left:.8mm solid var(--rani);padding:.4mm 0 .4mm 2.3mm;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.vhb-totals{display:grid;gap:1mm;position:relative}
.vhb-line{display:flex;justify-content:space-between;font-size:10px;color:#333}
.vhb-grand{display:flex;justify-content:space-between;align-items:baseline;border-top:.45mm solid var(--ink);padding-top:1.2mm}
.vhb-grand span{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.vhb-grand b{font-size:23px;font-weight:800;line-height:1}
.vhb-due{background:var(--ink);color:#fff;border-radius:1.8mm;display:flex;justify-content:space-between;align-items:center;padding:1.6mm 2.8mm}
.vhb-due span{font-size:7px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.vhb-due b{font-size:16px;font-weight:800}
.vhb-stamp{position:absolute;right:1mm;top:-11mm;transform:rotate(-9deg);border:.6mm solid var(--rani);outline:.25mm solid var(--rani);outline-offset:.6mm;color:var(--rani);border-radius:2mm;padding:1mm 2.6mm;text-align:center;font-weight:800;line-height:1;background:rgba(255,255,255,.7)}
.vhb-stamp.paid{top:auto;right:auto;left:-38mm;bottom:-2mm}
.vhb-stamp b{display:block;font-size:17px;letter-spacing:.06em}
.vhb-stamp small{display:block;font-size:6.5px;font-weight:800;letter-spacing:.16em;margin-top:.8mm}
.vhb-qrs{height:22mm;display:grid;grid-template-columns:1fr 1fr;gap:3mm}
.vhb-qrs.one{grid-template-columns:1fr}
.vhb-qr{display:grid;grid-template-columns:18mm 1fr;gap:2.6mm;align-items:center;border:.3mm solid var(--ink);border-radius:2.2mm;padding:1.8mm;min-width:0}
.vhb-qr img,.vhb-qr svg{width:18mm;height:18mm;display:block}
.vhb-qr b{display:block;font-size:10.5px;font-weight:800;line-height:1.2}
.vhb-qr p{margin:.8mm 0 0;font-size:8px;line-height:1.35;color:#444}
.vhb-qr.wa{border-color:var(--rani);border-width:.45mm}
.vhb-qr.wa b{color:var(--rani)}
.vhb-fine{height:20mm;display:grid;grid-template-columns:1fr 36mm;gap:4mm;align-items:end;border-top:.2mm dashed #999;padding-top:1.8mm}
.vhb-fine ol{list-style:decimal;margin:.6mm 0 0;padding-left:3.4mm;font-size:7.2px;line-height:1.42;color:#333}
.vhb-sig{text-align:center;font-size:7.6px;color:#333}
.vhb-sig img{height:9mm;display:block;margin:0 auto .5mm}
.vhb-sig i{display:block;border-top:.25mm solid var(--ink);padding-top:.8mm;font-style:normal;font-weight:700}
@media print{.vhb{display:block}.vhb-page{box-shadow:none}}
`;

const money = (value, digits = 2) =>
  toNumber(value).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: 2 });
const rupees = (value) => `₹${money(value, 0)}`;

function spacedPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

function Border({ bottom }) {
  return <div className={`vhb-border${bottom ? " bot" : ""}`} />;
}

function FirstHeader({ customerName, customerContact, invoiceId, invoiceDate }) {
  return (
    <>
      <div className="vhb-brand">
        <img src="new-logo.png" alt="Variety Heaven" />
        <p>
          {SHOP.address}
          <br />
          {SHOP.contacts.map((item, index) => (
            <span key={item}>
              {index > 0 && <span className="vhb-sep">◆</span>}
              {item}
            </span>
          ))}
        </p>
      </div>
      <div className="vhb-title">
        <i />
        <span>INVOICE</span>
        <i />
      </div>
      <div className="vhb-meta">
        <div>
          <span className="vhb-cap">Billed to</span>
          <b>{customerName || "Walk-in customer"}</b>
        </div>
        <div>
          <span className="vhb-cap">Phone</span>
          <b>{customerContact ? spacedPhone(customerContact) : "–"}</b>
        </div>
        <div>
          <span className="vhb-cap">Bill no</span>
          <b>#{invoiceId}</b>
        </div>
        <div>
          <span className="vhb-cap">Date</span>
          <b>{invoiceDate}</b>
        </div>
      </div>
    </>
  );
}

function Settle({ total, payments, note }) {
  const cash = toNumber(payments?.cash);
  const upi = toNumber(payments?.upi);
  const credit = toNumber(payments?.credit);
  const known = Boolean(payments) && cash + upi + credit > 0;
  const paidNow = cash + upi;

  const chips = [
    ["Cash", cash],
    ["UPI", upi],
    ["Credit", credit],
  ].filter(([, amount]) => amount > 0);

  return (
    <div className="vhb-settle">
      <div className="vhb-split">
        {known && (
          <>
            <span className="vhb-cap">Paid by</span>
            <div className="vhb-chips">
              {chips.map(([label, amount]) => (
                <span key={label} className="vhb-chip">
                  {label} <b>{rupees(amount)}</b>
                </span>
              ))}
            </div>
          </>
        )}
        {note && (
          <div className="vhb-note">
            <b>Note:</b> {note}
          </div>
        )}
      </div>
      <div className="vhb-totals">
        {known && credit > 0 && (
          <div className="vhb-stamp vhb-d">
            <b>CREDIT</b>
            <small>{rupees(credit)} DUE</small>
          </div>
        )}
        {known && credit === 0 && (
          <div className="vhb-stamp paid vhb-d">
            <b>PAID</b>
            <small>THANK YOU</small>
          </div>
        )}
        <div className="vhb-grand">
          <span>Total</span>
          <b className="vhb-d">₹{money(total)}</b>
        </div>
        {known && credit > 0 && (
          <>
            <div className="vhb-line">
              <span>Paid today</span>
              <span>₹{money(paidNow)}</span>
            </div>
            <div className="vhb-due">
              <span>Balance due</span>
              <b className="vhb-d">{rupees(credit)}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QrCodes({ dueAmount }) {
  return (
    <div className={`vhb-qrs${dueAmount > 0 ? "" : " one"}`}>
      {dueAmount > 0 && (
        <div className="vhb-qr">
          <QRCodeSVG value={upiLinkFor(dueAmount)} size={68} />
          <div>
            <b>Pay {rupees(dueAmount)} by UPI</b>
            <p>Scan with any UPI app. The amount fills in by itself.</p>
          </div>
        </div>
      )}
      <div className="vhb-qr wa">
        <img src="whatsappQR.png" alt="WhatsApp group QR" />
        <div>
          <b>Join our WhatsApp group</b>
          <p>
            New arrivals and offers reach the group first.
            {dueAmount > 0 ? "" : " Scan with your phone camera."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Fine() {
  return (
    <div className="vhb-fine">
      <div>
        <span className="vhb-cap">Terms</span>
        <ol>
          {SHOP.terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ol>
      </div>
      <div className="vhb-sig">
        <img src="sign.svg" alt="" />
        <i>For Variety Heaven</i>
      </div>
    </div>
  );
}

/** The A5 bill, split into as many pages as its items need. */
export const PrintableInvoice = ({
  customerName,
  customerContact,
  invoiceId,
  invoiceDate,
  products,
  total,
  payments,
  note,
}) => {
  const lines = products || [];
  const pages = paginateBill(lines);
  const itemCount = lines.reduce((sum, line) => sum + toNumber(line.quantity), 0);
  const credit = toNumber(payments?.credit);
  const unpaid = !payments || toNumber(payments.cash) + toNumber(payments.upi) + credit === 0;
  const dueAmount = unpaid ? toNumber(total) : credit;

  return (
    <div className="vhb">
      <style>{STYLES}</style>
      {pages.map((page) => (
        <section key={page.number} className="vhb-page">
          <Border />
          <div className="vhb-body">
            {page.isFirst ? (
              <FirstHeader
                customerName={customerName}
                customerContact={customerContact}
                invoiceId={invoiceId}
                invoiceDate={invoiceDate}
              />
            ) : (
              <div className="vhb-slim">
                <img src="new-logo.png" alt="Variety Heaven" />
                <div>
                  <b>Bill #{invoiceId}</b> · {customerName || "Walk-in customer"} · {invoiceDate}
                  <br />
                  Page {page.number} of {pages.length}
                </div>
              </div>
            )}

            <div>
              <div className="vhb-cols vhb-thead vhb-cap">
                <span>#</span>
                <span>Item</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              {!page.isFirst && (
                <div className="vhb-cols vhb-row bf">
                  <span />
                  <span>Brought forward from page {page.number - 1}</span>
                  <span />
                  <span />
                  <span>{money(page.broughtForward)}</span>
                </div>
              )}
              {page.rows.map(({ line, index, amount }) => (
                <div
                  key={index}
                  className={`vhb-cols vhb-row${String(line.name ?? "").length > TALL_NAME_CHARS ? " tall" : ""}`}
                >
                  <span className="i">{index + 1}</span>
                  <span className="nm">{line.name}</span>
                  <span>{line.quantity}</span>
                  <span>{money(line.price)}</span>
                  <span>{money(amount)}</span>
                </div>
              ))}
              <div className="vhb-tfoot">
                {page.isLast ? (
                  <>
                    <span>
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </span>
                    {pages.length > 1 && (
                      <span>
                        Page {page.number} of {pages.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span>Continued on page {page.number + 1}</span>
                    <span>
                      Carried forward <b>₹{money(page.carriedForward)}</b>
                    </span>
                  </>
                )}
              </div>
            </div>

            {page.isLast && (
              <>
                <Settle total={total} payments={payments} note={note} />
                <QrCodes dueAmount={dueAmount} />
                <Fine />
              </>
            )}
          </div>
          <Border bottom />
        </section>
      ))}
    </div>
  );
};
