import { DEFAULT_SIZE } from "./labelStock";
import { LOGO_ASPECT } from "./images";

export const newId = () => Math.random().toString(36).slice(2, 10);

export function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (c ^ (Math.random() * 16) >> (c / 4)).toString(16)
  );
}

export const ELEMENT_TYPES = {
  text: { label: "Text", defaults: { w: 24, h: 4, text: "{name}", fontId: "hanken", fontSize: 8, minSize: 6, maxLines: 1, fontWeight: 700, italic: false, align: "left", vAlign: "top", letterSpacing: 0, lineHeight: 1.15, uppercase: false, color: "#000" } },
  qr: { label: "QR code", defaults: { w: 14, h: 14, value: "{code}", ecLevel: "M" } },
  barcode: { label: "Barcode", defaults: { w: 32, h: 9, value: "{code}", symbology: "code128", showText: true, textSize: 5 } },
  image: { label: "Image", defaults: { w: 20, h: 20 / LOGO_ASPECT, src: "logo", aspect: LOGO_ASPECT, fit: "contain", align: "left" } },
  line: { label: "Line", defaults: { w: 20, h: 0.3, dash: "solid" } },
  box: { label: "Box", defaults: { w: 20, h: 10, strokeWidth: 0.3, fill: "none", radius: 0 } },
  ellipse: { label: "Ellipse", defaults: { w: 10, h: 10, strokeWidth: 0.3, fill: "none" } },
};

export function createElement(type, overrides = {}) {
  return {
    id: newId(),
    type,
    name: ELEMENT_TYPES[type].label,
    x: 2,
    y: 2,
    rotation: 0,
    locked: false,
    hidden: false,
    guide: false,
    condition: null,
    ...ELEMENT_TYPES[type].defaults,
    ...overrides,
  };
}

export function normalizeDesign(row) {
  return {
    id: row.id,
    name: row.name || "Untitled",
    is_default: Boolean(row.is_default),
    size: { ...DEFAULT_SIZE, ...(row.size ?? {}) },
    elements: Array.isArray(row.elements) ? row.elements : [],
    variables: Array.isArray(row.variables) ? row.variables : [],
    default_for: Array.isArray(row.default_for) ? row.default_for : [],
    updated_at: row.updated_at ?? new Date().toISOString(),
  };
}

export const SEED_IDS = {
  refined: "5eed1abe-0000-4000-8000-000000000001",
  band: "5eed1abe-0000-4000-8000-000000000002",
  block: "5eed1abe-0000-4000-8000-000000000003",
};

const px = (value) => Math.round((value / 96) * 25.4 * 1000) / 1000;
const pxToPt = (value) => Math.round(value * 0.75 * 1000) / 1000;

const CODE = { fontId: "mono", fontWeight: 700, fontSize: pxToPt(5.8), minSize: pxToPt(5.8), letterSpacing: 0.06, lineHeight: 1.2, align: "center", text: "{code | spaced}" };
const TAG = { fontId: "hanken", fontWeight: 800, fontSize: pxToPt(3.5), minSize: pxToPt(3.5), letterSpacing: 0.2, lineHeight: 1.2, uppercase: true, text: "{tagline}" };
const NAME = { fontId: "hanken", fontWeight: 800, fontSize: pxToPt(6.6), minSize: pxToPt(6.6), letterSpacing: 0.03, lineHeight: 1.12, uppercase: true, maxLines: 2, text: "{name}" };
const PRICE = { fontId: "bricolage", fontWeight: 800, fontSize: pxToPt(19), minSize: 10, letterSpacing: -0.04, lineHeight: 0.9, text: "{price | inr}" };

const EDGE_SVG = (() => {
  const shapes = Array.from({ length: 17 }, (_, i) => {
    const x = 1.6 + i * 3.2;
    return `<circle cx='${x.toFixed(1)}' cy='1.6' r='.58'/><path d='M${(x + 1.425).toFixed(3)} 1.6A1.425 1.425 0 0 1 ${x.toFixed(1)} 3.025' fill='none' stroke='%23000' stroke-width='.25'/>`;
  }).join("");
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50.8 2.9' preserveAspectRatio='none'>${shapes}</svg>`;
})();

const at = (type, name, box, props = {}) => createElement(type, { name, ...box, ...props });

/** The three original sticker styles, rebuilt as editable designs. Refined is the default. */
export function seedDesigns() {
  const updated_at = new Date(0).toISOString();
  const qr = (x, y, size) => at("qr", "QR code", { x, y, w: size, h: size });
  const code = (x, y, w) => at("text", "Code", { x, y, w, h: px(5.8 * 1.2) }, CODE);
  const logo = (x, y, w, h) => at("image", "Logo", { x, y, w, h });
  const priceHeight = px(19 * 0.9);

  const refined = normalizeDesign({
    id: SEED_IDS.refined,
    name: "Refined",
    is_default: true,
    updated_at,
    elements: [
      qr(2.8, 2.2, 15.6),
      code(1.6, 24 - px(5.8 * 1.2), 18),
      logo(21.4, 1.6, 27.6, 3.9),
      at("text", "Tagline", { x: 21.4, y: 6.1, w: 27.6, h: px(3.5 * 1.2) }, TAG),
      at("line", "Rule", { x: 21.4, y: 6.1 + px(3.5 * 1.2) + 0.9, w: 27.6, h: 0.3 }),
      at("text", "Name", { x: 21.4, y: 6.1 + px(3.5 * 1.2) + 2, w: 27.6, h: px(6.6 * 1.12 * 2) }, NAME),
      at("text", "Price", { x: 21.4, y: 24 - priceHeight, w: 20.4, h: priceHeight }, PRICE),
      at("text", "MRP note", { x: 42, y: 23.7 - px(3.3 * 1.25 * 2), w: 7, h: px(3.3 * 1.25 * 2) }, {
        text: "MRP incl.\nof all taxes", fontId: "hanken", fontWeight: 700, fontSize: pxToPt(3.3), minSize: pxToPt(3.3), lineHeight: 1.25, maxLines: 2, align: "right",
      }),
    ],
  });

  const bandPriceHeight = px(19 * 1.2);
  const band = normalizeDesign({
    id: SEED_IDS.band,
    name: "Price band",
    updated_at,
    elements: [
      qr(2.8, 2.2, 15.6),
      code(1.6, 24 - px(5.8 * 1.2), 18),
      logo(21.2, 1.6, 27.8, 3.9),
      at("text", "Tagline", { x: 21.2, y: 6.1, w: 27.8, h: px(3.5 * 1.2) }, TAG),
      at("text", "Name", { x: 21.2, y: 6.1 + px(3.5 * 1.2) + 1, w: 27.8, h: px(6.6 * 1.12 * 2) }, NAME),
      at("box", "Band", { x: 21.2, y: 17, w: 32.6, h: 11.4 }, { fill: "black", strokeWidth: 0, radius: 2 }),
      at("text", "MRP", { x: 22.1, y: 20.4, w: 4, h: 1.6, rotation: 270 }, {
        text: "MRP", fontId: "hanken", fontWeight: 800, fontSize: pxToPt(4.4), minSize: pxToPt(4.4), letterSpacing: 0.2, lineHeight: 1.2, align: "center", vAlign: "middle", color: "#fff",
      }),
      at("text", "Price", { x: 26, y: 21.15 - bandPriceHeight / 2, w: 22.8, h: bandPriceHeight }, { ...PRICE, lineHeight: 1.2, align: "right", color: "#fff" }),
    ],
  });

  const block = normalizeDesign({
    id: SEED_IDS.block,
    name: "Block print",
    updated_at,
    elements: [
      at("image", "Border print", { x: 0, y: 0, w: 50.8, h: 2.9 }, { src: EDGE_SVG, aspect: 50.8 / 2.9, fit: "stretch" }),
      at("line", "Border rule", { x: 0, y: 2.9, w: 50.8, h: 0.3 }),
      at("text", "Name", { x: 2, y: 4.4, w: 29.6, h: px(6.6 * 1.12 * 2) }, { ...NAME, vAlign: "bottom" }),
      at("text", "Price", { x: 2, y: 4.4 + px(6.6 * 1.12 * 2) + 0.6, w: 29.6, h: px(21) }, { ...PRICE, fontSize: pxToPt(21), lineHeight: 1 }),
      logo(2, 21, 29.6, 3.2),
      qr(34.2, 4.8, 14),
      code(33.2, 24.2 - px(5.8 * 1.2), 16),
    ],
  });

  return [refined, band, block];
}

/** A copy with fresh ids, so it can be saved as its own design. */
export function cloneDesign(design, changes = {}) {
  return normalizeDesign({
    ...structuredClone(design),
    id: uuid(),
    is_default: false,
    default_for: [],
    updated_at: new Date().toISOString(),
    elements: design.elements.map((element) => ({ ...structuredClone(element), id: newId() })),
    ...changes,
  });
}

export function blankDesign(name = "New design") {
  return normalizeDesign({ id: uuid(), name, elements: [], updated_at: new Date().toISOString() });
}
