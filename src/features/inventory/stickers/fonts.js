import "@fontsource-variable/oswald";
import "@fontsource-variable/playfair-display";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/noto-sans-devanagari";
import "@fontsource-variable/noto-sans-gujarati";

/** Fonts bundled with the app, so labels print the same on every till without a network. */
export const LABEL_FONTS = [
  { id: "hanken", label: "Hanken Grotesk", family: '"Hanken Grotesk Variable"', sample: "Aa" },
  { id: "bricolage", label: "Bricolage Grotesque", family: '"Bricolage Grotesque Variable"', sample: "Aa" },
  { id: "oswald", label: "Oswald (condensed)", family: '"Oswald Variable"', sample: "Aa" },
  { id: "playfair", label: "Playfair Display (serif)", family: '"Playfair Display Variable"', sample: "Aa" },
  { id: "mono", label: "JetBrains Mono (codes)", family: '"JetBrains Mono Variable"', sample: "01" },
  { id: "devanagari", label: "Noto Sans Devanagari (हिन्दी)", family: '"Noto Sans Devanagari Variable"', sample: "अ" },
  { id: "gujarati", label: "Noto Sans Gujarati (ગુજરાતી)", family: '"Noto Sans Gujarati Variable"', sample: "અ" },
];

const FALLBACK = '"Noto Sans Devanagari Variable","Noto Sans Gujarati Variable",Arial,sans-serif';

export const fontById = (id) => LABEL_FONTS.find((font) => font.id === id) ?? LABEL_FONTS[0];

/** CSS font-family with the Indic fonts as fallback so mixed-script names still render. */
export const fontStack = (id) => `${fontById(id).family},${FALLBACK}`;

export const fontSpec = ({ fontId, fontWeight = 400, italic }, px) =>
  `${italic ? "italic " : ""}${fontWeight} ${px}px ${fontStack(fontId)}`;

const listeners = new Set();
let version = 0;

if (typeof document !== "undefined" && document.fonts) {
  document.fonts.addEventListener("loadingdone", () => {
    version += 1;
    listeners.forEach((listener) => listener());
  });
}

/** Bumps whenever a web font finishes loading, so measured text can be laid out again. */
export const fontsVersion = {
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => version,
};

/** Loads every face the given text objects use (all scripts they contain) before measuring. */
export async function loadFonts(elements, texts = []) {
  if (typeof document === "undefined" || !document.fonts) return;
  const sample = `${texts.join(" ")} Aa₹0123456789 अआ અઆ`;
  const specs = new Set(
    elements
      .filter((element) => element.type === "text")
      .map((element) => fontSpec(element, 20))
  );
  specs.add(fontSpec({ fontId: "mono", fontWeight: 700 }, 20));
  await Promise.all([...specs].map((spec) => document.fonts.load(spec, sample).catch(() => null)));
}
