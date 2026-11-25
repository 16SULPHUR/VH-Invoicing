import { rupees2 } from "./format";

/** Things to look at before filing. level: fix | check | info */
export function gstChecks({ gst, bills, ledgerGst, settings, period, today, creditNotes = [] }) {
  const checks = [];

  if (period.to >= today) checks.push({ level: "fix", title: "This period isn't over yet", text: "Figures will change until the last day has been billed. File after the period ends." });

  for (const doc of gst.documents) {
    if (doc.cancelled > 0) {
      const list = doc.missing.slice(0, 12).join(", ") + (doc.missing.length > 12 ? ` and ${doc.missing.length - 12} more` : "");
      checks.push({ level: "check", title: `${doc.cancelled} bill number${doc.cancelled > 1 ? "s" : ""} missing in FY ${doc.fy}`, text: `Numbers ${list} are not in the books, so they are reported as cancelled under Documents issued. If a real bill was deleted by mistake, enter it again before filing.` });
    }
  }

  const adjustments = bills.flatMap((b) => b.lines.filter((l) => l.kind === "adjustment").map((l) => ({ bill: b.id, ...l })));
  if (adjustments.length) {
    const amount = adjustments.reduce((s, l) => s + l.amount, 0);
    checks.push({ level: "info", title: `${adjustments.length} non-sale line${adjustments.length > 1 ? "s" : ""} left out (${rupees2(amount)})`, text: `Old dues, deposits and advances written on bills are money, not goods, so they carry no GST. Bills: ${[...new Set(adjustments.map((l) => l.bill))].slice(0, 15).join(", ")}.` });
  }

  const returns = bills.flatMap((b) => b.lines.filter((l) => l.kind === "return"));
  if (returns.length) {
    const amount = returns.reduce((s, l) => s + l.amount, 0);
    checks.push({ level: "info", title: `Returns of ${rupees2(-amount)} netted off`, text: "Goods taken back from walk-in customers reduce this period's B2C sales at the same rate, as the portal expects for unregistered buyers." });
  }

  if (gst.summary.taxable < 0) checks.push({ level: "fix", title: "Returns are larger than sales", text: "The portal does not accept negative B2C totals. Carry the extra returns into the next period's figures." });

  if (gst.defaultedLines > 0) {
    checks.push({ level: "check", title: `${gst.defaultedLines} item line${gst.defaultedLines > 1 ? "s" : ""} use the default HSN ${settings.defaultHsn}`, text: "Fine for sarees and dress material. Pick another HSN for petticoats, stitched blouses or other ready-made garments under HSN for each item below." });
  }

  if (ledgerGst != null && Math.abs(ledgerGst - gst.summary.tax) >= 1) {
    checks.push({ level: "info", title: `Accounts ledger shows ${rupees2(ledgerGst)} GST, this report ${rupees2(gst.summary.tax)}`, text: "The report works from the items on each bill and leaves out non-sale lines. Use the figures on this page for filing." });
  }

  const notes = creditNotes.filter((n) => !n.void);
  if (notes.length) {
    const amount = notes.reduce((s, n) => s + n.total, 0);
    checks.push({ level: "info", title: `${notes.length} counter credit note${notes.length > 1 ? "s" : ""} ${notes.length > 1 ? "reduce" : "reduces"} sales by ${rupees2(-amount)}`, text: "Goods taken back at the Counter are netted off like returns and listed as Credit Note under Documents issued." });
  }

  return checks;
}
