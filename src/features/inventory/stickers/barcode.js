import { code128, code39, drawingSVG, ean13, ean8, upca } from "bwip-js/browser";

export const SYMBOLOGIES = [
  { value: "code128", label: "Code 128", encode: code128 },
  { value: "ean13", label: "EAN-13", encode: ean13 },
  { value: "ean8", label: "EAN-8", encode: ean8 },
  { value: "upca", label: "UPC-A", encode: upca },
  { value: "code39", label: "Code 39", encode: code39 },
];

const cache = new Map();

/** Bars only (text is drawn separately so it stays sharp): { paths, modules, height } or { error }. */
export function encodeBarcode(symbology, text) {
  const key = `${symbology}|${text}`;
  if (cache.has(key)) return cache.get(key);
  const { encode } = SYMBOLOGIES.find(({ value }) => value === symbology) ?? SYMBOLOGIES[0];
  let result;
  try {
    if (!text) throw new Error("Nothing to encode");
    const svg = encode({ text: String(text), scale: 1, height: 10, includetext: false }, drawingSVG());
    const [, width, height] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/) ?? [];
    result = {
      paths: svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, ""),
      modules: Number(width),
      height: Number(height),
    };
  } catch (error) {
    result = { error: String(error?.message ?? error).replace(/^bwipp\.\w+#\d+:\s*/, "") };
  }
  if (cache.size > 2000) cache.clear();
  cache.set(key, result);
  return result;
}
