import { QRCodeSVG } from "qrcode.react";

// Inlined because the slip is rendered to a static string for the print window.
const STYLES = `
.vht{--rani:#d6246e;--ink:#111;color:var(--ink);font-size:9.5px;line-height:1.3;font-family:"Hanken Grotesk Variable","Hanken Grotesk",Arial,sans-serif;font-variant-numeric:tabular-nums}
.vht *{box-sizing:border-box;margin:0}
.vht-page{width:105mm;height:148mm;background:#fff;display:flex;flex-direction:column;overflow:hidden}
.vht-band{height:4.5mm;flex:none;border-bottom:.4mm solid var(--ink);background:radial-gradient(circle at 2.25mm 2.25mm,var(--rani) .7mm,transparent .8mm) 0 0/4.5mm 4.5mm,radial-gradient(circle at 0 0,transparent 1.5mm,var(--ink) 1.6mm 1.9mm,transparent 2mm) 2.25mm 2.25mm/4.5mm 4.5mm}
.vht-body{flex:1;display:flex;flex-direction:column;gap:2.4mm;padding:3.5mm 6mm 3mm;min-height:0}
.vht-d{font-family:"Bricolage Grotesque Variable","Bricolage Grotesque","Hanken Grotesk Variable",Arial,sans-serif;letter-spacing:-.02em}
.vht-cap{display:block;font-size:6.2px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#555}
.vht-head{display:flex;justify-content:space-between;align-items:flex-end;gap:3mm;border-bottom:.3mm solid var(--ink);padding-bottom:1.6mm}
.vht-head b{font-size:13px;font-weight:800;line-height:1}
.vht-head small{display:block;font-size:7.5px;color:#444;margin-top:.6mm}
.vht-kind{font-size:7px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--rani);text-align:right}
.vht-top{display:grid;grid-template-columns:1fr 23mm;gap:3mm;align-items:center}
.vht-token{font-size:34px;font-weight:800;line-height:.95}
.vht-top svg{width:23mm;height:23mm;display:block}
.vht-who{margin-top:1.2mm;font-size:10.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vht-who span{font-weight:400;color:#444}
.vht-hi{display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#fff;border-radius:1.6mm;padding:1.6mm 2.6mm}
.vht-hi .vht-cap{color:#ddd}
.vht-hi b{font-size:14px;font-weight:800}
.vht-grid{display:grid;grid-template-columns:auto 1fr;gap:.8mm 3mm;font-size:9px}
.vht-grid dt{color:#555}
.vht-grid dd{font-weight:600;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.vht-lines{display:grid;gap:.6mm;font-size:9px}
.vht-lines div{display:grid;grid-template-columns:1fr 7mm 16mm;gap:1.5mm;border-bottom:.15mm solid #ddd;padding-bottom:.5mm}
.vht-lines span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vht-lines span+span{text-align:right}
.vht-more{color:#555;font-style:italic}
.vht-money{display:grid;gap:.6mm;margin-top:auto}
.vht-money div{display:flex;justify-content:space-between;font-size:9.5px;color:#333}
.vht-money .big{border-top:.4mm solid var(--ink);padding-top:1mm;color:var(--ink);align-items:baseline}
.vht-money .big span{font-size:7.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.vht-money .big b{font-size:19px;font-weight:800;line-height:1}
.vht-note{font-size:7.5px;line-height:1.35;color:#333;border-left:.7mm solid var(--rani);padding-left:2mm}
.vht-cut{flex:none;display:flex;align-items:center;gap:2mm;color:#888;font-size:7px;padding:0 4mm}
.vht-cut i{flex:1;border-top:.3mm dashed #999}
.vht-tag{flex:none;height:30mm;display:grid;grid-template-columns:1fr 20mm;gap:3mm;align-items:center;padding:2mm 6mm 3mm}
.vht-tag svg{width:20mm;height:20mm;display:block}
.vht-tag .vht-token{font-size:28px}
.vht-tag p{font-size:9px;margin-top:.8mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;

const MAX_LINES = 7;

/**
 * An A6 slip with a big token and its QR: alteration tokens, credit notes, booking receipts
 * and approval (jangad) slips. `tag` adds a tear-off copy to tie to the garment.
 */
export function Slip({ kind, token, shop, customer, highlight, details = [], lines = [], money = [], note, tag }) {
  const shown = lines.slice(0, MAX_LINES);
  const hidden = lines.length - shown.length;
  return (
    <div className="vht">
      {/* Raw, because static markup would escape the quotes in font names. */}
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="vht-page">
        <div className="vht-band" />
        <div className="vht-body">
          <div className="vht-head">
            <div>
              <b className="vht-d">{shop.name}</b>
              {shop.phone && <small>{shop.phone}</small>}
            </div>
            <div className="vht-kind">{kind}</div>
          </div>

          <div className="vht-top">
            <div style={{ minWidth: 0 }}>
              <span className="vht-cap">Token</span>
              <div className="vht-token vht-d">{token}</div>
              <p className="vht-who">
                {customer.name || "Customer"} {customer.phone && <span>· {customer.phone}</span>}
              </p>
            </div>
            <QRCodeSVG value={token} size={96} marginSize={0} />
          </div>

          {highlight && (
            <div className="vht-hi">
              <span className="vht-cap">{highlight.label}</span>
              <b className="vht-d">{highlight.value}</b>
            </div>
          )}

          {details.length > 0 && (
            <dl className="vht-grid">
              {details.map(({ label, value }) => [<dt key={`${label}-t`}>{label}</dt>, <dd key={`${label}-d`}>{value}</dd>])}
            </dl>
          )}

          {shown.length > 0 && (
            <div className="vht-lines">
              {shown.map((line, index) => (
                <div key={index}>
                  <span>{line.name}</span>
                  <span>×{line.quantity}</span>
                  <span>{line.amount}</span>
                </div>
              ))}
              {hidden > 0 && <p className="vht-more">and {hidden} more</p>}
            </div>
          )}

          {money.length > 0 && (
            <div className="vht-money">
              {money.map(({ label, value, big }) => (
                <div key={label} className={big ? "big" : undefined}>
                  <span>{label}</span>
                  {big ? <b className="vht-d">{value}</b> : <span>{value}</span>}
                </div>
              ))}
            </div>
          )}

          {note && <p className="vht-note">{note}</p>}
        </div>

        {tag && (
          <>
            <div className="vht-cut">
              ✂<i />
              <span>{tag.caption}</span>
              <i />
            </div>
            <div className="vht-tag">
              <div style={{ minWidth: 0 }}>
                <div className="vht-token vht-d">{token}</div>
                {tag.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <QRCodeSVG value={token} size={80} marginSize={0} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
