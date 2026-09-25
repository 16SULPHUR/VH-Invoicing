import { QRCodeSVG } from "qrcode.react";

const TAGLINE = "Drape Yourself in Luxury";

// Inlined because labels are also rendered to a static string for the print window.
const CSS = `
.vhs{width:50.8mm;height:25.4mm;background:#fff;color:#000;overflow:hidden;position:relative;box-sizing:border-box;font-family:"Hanken Grotesk Variable","Hanken Grotesk",Arial,sans-serif;line-height:1.2;break-after:page;page-break-after:always}
.vhs:last-child{break-after:auto;page-break-after:auto}
.vhs *{box-sizing:border-box;margin:0}
.vhs img{display:block;filter:grayscale(1) contrast(3)}
.vhs svg{display:block;width:100%;height:auto}
.vhs-code{font-family:ui-monospace,"Courier New",monospace;font-size:5.8px;font-weight:700;letter-spacing:.06em;white-space:nowrap}
.vhs-d{font-family:"Bricolage Grotesque Variable","Bricolage Grotesque",Arial,sans-serif;font-weight:800;letter-spacing:-.04em;white-space:nowrap}
.vhs-name{font-size:6.6px;font-weight:800;letter-spacing:.03em;line-height:1.12;text-transform:uppercase;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.vhs-tag{font-size:3.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}
.vhs-q{display:flex;flex-direction:column;align-items:center;justify-content:space-between}
.vhs.refined,.vhs.band{display:grid;grid-template-columns:18mm 1fr;gap:1.8mm;padding:1.6mm 1.8mm 1.4mm 1.6mm}
.vhs.refined .vhs-q svg,.vhs.band .vhs-q svg{width:15.6mm;margin:.6mm}
.vhs-r{display:flex;flex-direction:column;min-width:0}
.vhs-r img{height:3.9mm;width:100%;object-fit:contain;object-position:left}
.vhs-r .vhs-tag{margin-top:.6mm}
.vhs-rule{height:.3mm;background:#000;margin:.9mm 0 .8mm}
.vhs-price{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:1mm}
.vhs-price .vhs-d{font-size:19px;line-height:.9}
.vhs-mrp{font-size:3.3px;font-weight:700;line-height:1.25;text-align:right;padding-bottom:.3mm}
.vhs.band{padding:1.6mm 0 0 1.6mm;gap:1.6mm}
.vhs.band .vhs-q{padding-bottom:1.4mm}
.vhs.band .vhs-r img,.vhs.band .vhs-r .vhs-tag{margin-right:1.8mm}
.vhs.band .vhs-name{margin:1mm 1.8mm 0 0}
.vhs-band{margin-top:auto;height:8.4mm;background:#000;color:#fff;border-top-left-radius:2mm;display:flex;align-items:center;justify-content:space-between;padding:1mm 2mm 1.1mm 2.2mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.vhs-band small{font-size:4.4px;font-weight:800;letter-spacing:.2em;writing-mode:vertical-rl;transform:rotate(180deg)}
.vhs-band .vhs-d{font-size:19px}
.vhs.block{display:grid;grid-template-rows:3.2mm 1fr}
.vhs-edge{border-bottom:.3mm solid #000;background:radial-gradient(circle at 1.6mm 1.6mm,#000 .55mm,transparent .62mm) 0 0/3.2mm 3.2mm,radial-gradient(circle at 0 0,transparent 1.25mm,#000 1.3mm 1.55mm,transparent 1.6mm) 1.6mm 1.6mm/3.2mm 3.2mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.vhs-body{display:grid;grid-template-columns:1fr 16mm;gap:1.6mm;padding:1.2mm 1.6mm 1.2mm 2mm;min-height:0}
.vhs-l{display:flex;flex-direction:column;min-width:0}
.vhs-l .vhs-d{font-size:21px;line-height:1;margin-top:.6mm}
.vhs-l img{height:3.2mm;width:100%;object-fit:contain;object-position:left;margin-top:auto}
.vhs.block .vhs-q svg{width:14mm;margin:.4mm .6mm}
`;

export function StickerStyles() {
  return <style>{CSS}</style>;
}

const spacedCode = (code) => {
  const text = String(code ?? "");
  return /^\d{6,}$/.test(text) ? `${text.slice(0, -5)} ${text.slice(-5)}` : text;
};

const rupees = (price) => `₹${(Number(price) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function Qr({ code }) {
  return (
    <div className="vhs-q">
      <QRCodeSVG value={String(code || "0")} size={64} level="M" marginSize={0} />
      <span className="vhs-code">{spacedCode(code)}</span>
    </div>
  );
}

/** One 2 x 1 inch thermal label. Render inside <StickerStyles />. */
export function StickerLabel({ product, style = "refined" }) {
  const { name, sellingPrice, barcode } = product;

  if (style === "block") {
    return (
      <div className="vhs block">
        <div className="vhs-edge" />
        <div className="vhs-body">
          <div className="vhs-l">
            <span className="vhs-name">{name}</span>
            <span className="vhs-d">{rupees(sellingPrice)}</span>
            <img src="/new-logo.png" alt="Variety Heaven" />
          </div>
          <Qr code={barcode} />
        </div>
      </div>
    );
  }

  return (
    <div className={`vhs ${style === "band" ? "band" : "refined"}`}>
      <Qr code={barcode} />
      <div className="vhs-r">
        <img src="/new-logo.png" alt="Variety Heaven" />
        <span className="vhs-tag">{TAGLINE}</span>
        {style === "band" ? (
          <>
            <span className="vhs-name">{name}</span>
            <div className="vhs-band">
              <small>MRP</small>
              <span className="vhs-d">{rupees(sellingPrice)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="vhs-rule" />
            <span className="vhs-name">{name}</span>
            <div className="vhs-price">
              <span className="vhs-d">{rupees(sellingPrice)}</span>
              <span className="vhs-mrp">
                MRP incl.
                <br />
                of all taxes
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Every label in the queue, one per printed page. */
export function StickerSheet({ labels, style }) {
  return (
    <div>
      <StickerStyles />
      {labels.map((product, index) => (
        <StickerLabel key={`${product.id}-${index}`} product={product} style={style} />
      ))}
    </div>
  );
}
