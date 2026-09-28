import { ageCode, evaluate, formatDate, isEmpty, isTruthy, renderTemplate, toDate, toNumber, FORMATTERS } from "./expr";

export const PRODUCT_VARIABLES = [
  { name: "name", label: "Product name" },
  { name: "price", label: "Selling price" },
  { name: "code", label: "Product code" },
  { name: "supplier", label: "Supplier name" },
  { name: "supplier_code", label: "Supplier code" },
  { name: "stock", label: "Stock" },
  { name: "date_added", label: "Date added" },
  { name: "cost", label: "Cost" },
  { name: "cost_code", label: "Cost in code letters" },
  { name: "age_code", label: "Age code (date added)" },
];

export const RUN_VARIABLES = [
  { name: "copy", label: "Copy of this product (1, 2, 3…)" },
  { name: "copies", label: "Copies of this product" },
  { name: "index", label: "Position in the print run" },
  { name: "total", label: "Stickers in the print run" },
  { name: "print_date", label: "Print date" },
  { name: "print_age_code", label: "Age code (print date)" },
];

export const SHOP_VARIABLES = [
  { name: "shop_name", label: "Shop name" },
  { name: "tagline", label: "Tagline" },
  { name: "phone", label: "Phone" },
  { name: "whatsapp", label: "WhatsApp link" },
  { name: "upi_id", label: "UPI ID" },
];

export const VARIABLE_KINDS = [
  { value: "formula", label: "Formula", help: "Worked out from other values, e.g. price * 1.25 | end9" },
  { value: "prompt", label: "Ask at print", help: "Asked once when printing, used for the whole run" },
  { value: "counter", label: "Counter", help: "Running number with start, step and padding" },
  { value: "date", label: "Date", help: "Print date or a fixed date, in your format" },
  { value: "text", label: "Fixed text", help: "The same words on every sticker" },
];

export const SAMPLE_PRODUCT = {
  id: "sample",
  name: "Chakra",
  sellingPrice: 900,
  barcode: 10200487,
  cost: 540,
  quantity: 3,
  created_at: new Date().toISOString(),
  supplier: null,
  attributes: { fabric: "Cotton", colour: "Indigo", size: "Free", design_no: "D-214", work: "Block print" },
};

export const NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

export const toVariableName = (text) =>
  String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^(\d)/, "_$1");

const BUILT_IN = new Set([...PRODUCT_VARIABLES, ...RUN_VARIABLES, ...SHOP_VARIABLES].map(({ name }) => name));

export const isBuiltInName = (name) => BUILT_IN.has(name) || name in FORMATTERS;

function counterValue(definition, run) {
  const start = toNumber(definition.start);
  const step = toNumber(definition.step);
  const position = definition.per === "product" ? run.copy : run.designIndex ?? run.index;
  const value = (Number.isFinite(start) ? start : 1) + (Number.isFinite(step) ? step : 1) * ((position || 1) - 1);
  return String(value).padStart(Number(definition.pad) || 0, "0");
}

function dateValue(definition, printDate) {
  const base =
    definition.source === "fixed"
      ? toDate(definition.date)
      : new Date(printDate.getTime() + (Number(definition.offset) || 0) * 86_400_000);
  if (!base) return "";
  return definition.format ? formatDate(base, definition.format) : base;
}

/**
 * Everything one sticker can refer to: product fields, product details, shop values, the
 * print run and the design's own variables (evaluated lazily, so formulas can build on
 * each other). Unknown names and warnings are collected for the designer.
 */
export function createScope({ design, product, supplier, settings = {}, run = {}, prompts = {} }) {
  const printDate = run.printDate ?? new Date();
  const attributes = product?.attributes && typeof product.attributes === "object" ? product.attributes : {};
  const base = {
    ...Object.fromEntries((settings.product_fields ?? []).map(({ key }) => [key, ""])),
    ...attributes,
    name: product?.name ?? "",
    price: product?.sellingPrice ?? "",
    code: product?.barcode ?? "",
    supplier: supplier?.name ?? "",
    supplier_code: supplier?.code ?? "",
    stock: product?.quantity ?? "",
    date_added: toDate(product?.created_at) ?? "",
    cost: product?.cost ?? "",
    age_code: ageCode(product?.created_at),
    copy: run.copy ?? 1,
    copies: run.copies ?? 1,
    index: run.index ?? 1,
    total: run.total ?? 1,
    print_date: printDate,
    print_age_code: ageCode(printDate),
    shop_name: settings.shop_name ?? "",
    tagline: settings.tagline ?? "",
    phone: settings.phone ?? "",
    whatsapp: settings.whatsapp ?? "",
    upi_id: settings.upi_id ?? "",
  };

  const custom = new Map((design?.variables ?? []).map((definition) => [definition.name, definition]));
  const cache = new Map();
  const resolving = new Set();

  const scope = {
    codeWord: settings.cost_code_word,
    errors: [],
    missing: new Set(),
    warnings: new Set(),
    warn: (code) => scope.warnings.add(code),
    get(name) {
      if (cache.has(name)) return cache.get(name);
      let value;
      if (custom.has(name)) {
        if (resolving.has(name)) {
          scope.errors.push(`"${name}" refers to itself`);
          return "";
        }
        resolving.add(name);
        value = customValue(custom.get(name));
        resolving.delete(name);
      } else if (name === "cost_code") {
        value = FORMATTERS.costcode.fn(product?.cost, undefined, scope);
      } else if (name in base) {
        value = base[name];
      } else {
        scope.missing.add(name);
        value = undefined;
      }
      cache.set(name, value);
      return value;
    },
  };

  function customValue(definition) {
    switch (definition.kind) {
      case "formula":
        return evaluate(definition.expr, scope);
      case "prompt":
        return isEmpty(prompts[definition.name]) ? definition.default ?? "" : prompts[definition.name];
      case "counter":
        return counterValue(definition, { index: base.index, copy: base.copy, designIndex: run.designIndex });
      case "date":
        return dateValue(definition, printDate);
      default:
        return renderTemplate(definition.value ?? "", scope);
    }
  }

  return scope;
}

export const CONDITION_OPS = [
  { value: "filled", label: "is not empty", needsValue: false },
  { value: "empty", label: "is empty", needsValue: false },
  { value: "eq", label: "=", symbol: "==" },
  { value: "ne", label: "≠", symbol: "!=" },
  { value: "gt", label: ">", symbol: ">" },
  { value: "gte", label: "≥", symbol: ">=" },
  { value: "lt", label: "<", symbol: "<" },
  { value: "lte", label: "≤", symbol: "<=" },
  { value: "expr", label: "custom rule", needsValue: false },
];

const literal = (value) => (value !== "" && Number.isFinite(Number(value)) ? String(Number(value)) : JSON.stringify(String(value ?? "")));

/** Whether an object shows on this sticker. No condition means always. */
export function conditionHolds(condition, scope) {
  if (!condition?.op) return true;
  if (condition.op === "expr") return isTruthy(evaluate(condition.expr, scope));
  const value = evaluate(condition.field || '""', scope);
  if (condition.op === "filled") return !isEmpty(value);
  if (condition.op === "empty") return isEmpty(value);
  const op = CONDITION_OPS.find(({ value: candidate }) => candidate === condition.op);
  if (!op?.symbol) return true;
  return isTruthy(evaluate(`(${condition.field || '""'}) ${op.symbol} ${literal(condition.value)}`, scope));
}

export function describeCondition(condition) {
  if (!condition?.op) return "Always";
  if (condition.op === "expr") return `When ${condition.expr || "…"}`;
  const op = CONDITION_OPS.find(({ value }) => value === condition.op);
  return `When ${condition.field || "…"} ${op?.label ?? ""}${op?.needsValue === false ? "" : ` ${condition.value ?? ""}`}`;
}

/** Every name a design can use, grouped for pickers: product, details, shop, run, design. */
export function variableGroups(design, settings = {}) {
  return [
    { label: "Product", items: PRODUCT_VARIABLES },
    { label: "Product details", items: (settings.product_fields ?? []).map(({ key, label }) => ({ name: key, label })) },
    { label: "Shop", items: SHOP_VARIABLES },
    { label: "Print run", items: RUN_VARIABLES },
    { label: "This design", items: (design?.variables ?? []).map(({ name, label }) => ({ name, label: label || name })) },
  ].filter((group) => group.items.length > 0);
}
