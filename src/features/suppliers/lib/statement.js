import { BUSINESS } from "@/config/business";
import { formatRupees } from "@/utils/formatters";

const esc = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const day = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** Opens a plain printable statement of one supplier's bills and payments. */
export function printStatement({ supplier, entries, totals }) {
  const rows = entries
    .map(
      (entry) =>
        `<tr><td>${day(entry.date)}</td><td>${esc(entry.label)}</td><td class="n">${entry.debit ? formatRupees(entry.debit) : ""}</td><td class="n">${entry.credit ? formatRupees(entry.credit) : ""}</td><td class="n">${formatRupees(entry.balance)}</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(supplier.name)} statement</title>
<style>body{font:13px system-ui,sans-serif;margin:24px;color:#111}h1{font-size:18px;margin:0}p{margin:4px 0 14px;color:#555}
table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f4f4f4}.n{text-align:right;font-variant-numeric:tabular-nums}
.t{margin-top:14px;font-weight:700;text-align:right}</style></head><body>
<h1>${esc(supplier.name)}</h1><p>Statement from ${esc(BUSINESS.name ?? "Variety Heaven")} · ${day(new Date().toISOString().slice(0, 10))}${supplier.gstin ? ` · GSTIN ${esc(supplier.gstin)}` : ""}</p>
<table><thead><tr><th>Date</th><th>Particulars</th><th class="n">Billed</th><th class="n">Paid / adjusted</th><th class="n">Balance</th></tr></thead><tbody>${rows}</tbody></table>
<p class="t">Outstanding ${formatRupees(totals.outstanding)}</p><script>window.onload=()=>window.print()</script></body></html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
