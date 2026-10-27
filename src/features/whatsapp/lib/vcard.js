import { waNumber } from "./waLink";
import { greetingName } from "./templates";

const escape = (text) => text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1");

/** A .vcf with one card per customer, e.g. "VH · Priya Shah" on +91 98250 10000. */
export function toVcf(entries, prefix) {
  const seen = new Set();
  const cards = [];
  for (const entry of entries) {
    const number = waNumber(entry.phone);
    if (!number || seen.has(number)) continue;
    seen.add(number);
    const name = `${prefix}${greetingName(entry.name) || entry.phone}`.trim();
    cards.push(
      ["BEGIN:VCARD", "VERSION:3.0", `FN:${escape(name)}`, `N:;${escape(name)};;;`, `TEL;TYPE=CELL:+${number}`, "END:VCARD"].join("\r\n")
    );
  }
  return { text: cards.join("\r\n") + (cards.length ? "\r\n" : ""), count: cards.length };
}

export function downloadVcf(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/vcard;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
