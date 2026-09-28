import { rupees2 } from "./format";

const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

/** A one-page summary for the accountant, printed from a hidden frame so the app layout stays out of it. */
export function printGstSummary({ gst, settings, period, shopName, payable, itc }) {
  const s = gst.summary;
  const body = `
    <h1>${esc(shopName)} · GST summary</h1>
    <p class="sub">GSTIN ${esc(settings.gstin)} · ${esc(period.label)} (${esc(period.from)} to ${esc(period.to)})</p>
    <h2>GSTR-3B 3.1(a) Outward taxable supplies</h2>
    ${table(["Taxable value", "IGST", "CGST", "SGST", "Cess"], [[rupees2(s.taxable), "0", rupees2(s.cgst), rupees2(s.sgst), "0"]])}
    <h2>Tax to pay</h2>
    ${table(["", "IGST", "CGST", "SGST"], [
      ["Output tax", "0", rupees2(s.cgst), rupees2(s.sgst)],
      ["Input credit (GSTR-2B)", rupees2(itc.igst || 0), rupees2(itc.cgst || 0), rupees2(itc.sgst || 0)],
      ["Cash to pay", "0", rupees2(payable.cgst), rupees2(payable.sgst)],
    ])}
    <h2>GSTR-1 · B2C (others)</h2>
    ${table(["Place of supply", "Rate", "Taxable value", "CGST", "SGST"], gst.b2cs.map((r) => [`${settings.stateCode}-${settings.stateName}`, `${r.rate}%`, rupees2(r.taxable), rupees2(r.cgst), rupees2(r.sgst)]))}
    <h2>GSTR-1 · HSN summary (B2C)</h2>
    ${table(["HSN", "Description", "UQC", "Qty", "Value", "Rate", "Taxable", "CGST", "SGST"], gst.hsn.map((r) => [r.hsn, r.description, settings.uqc, r.quantity, rupees2(r.value), `${r.rate}%`, rupees2(r.taxable), rupees2(r.cgst), rupees2(r.sgst)]))}
    <h2>GSTR-1 · Documents issued</h2>
    ${table(["Nature", "From", "To", "Total", "Cancelled", "Net issued"], [
      ...gst.documents.map((d) => ["Invoices for outward supply", d.from, d.to, d.total, d.cancelled, d.issued]),
      ...gst.creditNoteDocs.map((d) => ["Credit Note", d.from, d.to, d.total, d.cancelled, d.issued]),
    ])}
    <p class="foot">Prices on bills include GST. Taxable value = amount ÷ (1 + rate). Printed ${esc(new Date().toLocaleString("en-IN"))}.</p>`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GST ${esc(period.label)}</title><style>
    @page { size: A4; margin: 14mm; }
    body { font: 12px/1.45 system-ui, sans-serif; color: #111; }
    h1 { font-size: 20px; margin: 0; } h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: .04em; }
    .sub { margin: 4px 0 0; color: #555; } .foot { margin-top: 18px; color: #666; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: right; }
    th:first-child, td:first-child { text-align: left; } th { background: #f3f1f8; font-size: 11px; }
  </style></head><body>${body}</body></html>`;

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(frame);
  frame.contentDocument.open();
  frame.contentDocument.write(html);
  frame.contentDocument.close();
  frame.contentWindow.focus();
  setTimeout(() => {
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1000);
  }, 50);
}
