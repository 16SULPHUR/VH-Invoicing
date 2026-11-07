/**
 * A small, safe expression language for sticker text: {name | upper}, {price * 1.25 | end9 | inr},
 * {stock == 1 ? "Last piece" : ""}. It is parsed here and never passed to eval.
 */

const TOKEN =
  /\s*(?:(\d+(?:\.\d+)?|\.\d+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|“[^”]*”)|([A-Za-z_][\w.]*)|(==|!=|>=|<=|&&|\|\||[-+*/%×÷()<>!?:,|=]))/y;

function tokenize(source) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  let index = 0;
  while (index < source.length) {
    if (/^\s*$/.test(source.slice(index))) break;
    TOKEN.lastIndex = index;
    const match = TOKEN.exec(source);
    if (!match) throw new Error(`Unexpected "${source.slice(index).trim()[0]}"`);
    index = TOKEN.lastIndex;
    const [, number, string, word, op] = match;
    if (number !== undefined) tokens.push({ type: "num", value: Number(number) });
    else if (string !== undefined) tokens.push({ type: "str", value: string.slice(1, -1).replace(/\\(.)/g, "$1") });
    else if (word !== undefined) {
      if (word === "and" || word === "or" || word === "not") tokens.push({ type: "op", value: { and: "&&", or: "||", not: "!" }[word] });
      else if (word === "true" || word === "false") tokens.push({ type: "num", value: word === "true" ? 1 : 0 });
      else tokens.push({ type: "word", value: word });
    } else tokens.push({ type: "op", value: { "×": "*", "÷": "/", "=": "==" }[op] ?? op });
  }
  return tokens;
}

function parse(source) {
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const isOp = (...ops) => peek()?.type === "op" && ops.includes(peek().value);
  const expect = (op) => {
    if (!isOp(op)) throw new Error(`Expected "${op}"`);
    position += 1;
  };

  const args = () => {
    const list = [];
    expect("(");
    if (!isOp(")")) {
      do {
        list.push(pipeline());
      } while (isOp(",") && ++position);
    }
    expect(")");
    return list;
  };

  function primary() {
    const token = tokens[position++];
    if (!token) throw new Error("Expression ends too early");
    if (token.type === "num" || token.type === "str") return { t: "lit", v: token.value };
    if (token.type === "word") {
      if (isOp("(")) {
        const [subject, ...rest] = args();
        return { t: "call", name: token.value, args: [subject ?? { t: "lit", v: "" }, ...rest] };
      }
      return { t: "var", name: token.value };
    }
    if (token.value === "(") {
      const inner = pipeline();
      expect(")");
      return inner;
    }
    throw new Error(`Unexpected "${token.value}"`);
  }

  function unary() {
    if (isOp("-", "!", "+")) {
      const op = tokens[position++].value;
      return { t: "un", op, a: unary() };
    }
    return primary();
  }

  const binary = (next, ops) =>
    function level() {
      let left = next();
      while (isOp(...ops)) {
        const op = tokens[position++].value;
        left = { t: "bin", op, a: left, b: next() };
      }
      return left;
    };

  const multiplicative = binary(unary, ["*", "/", "%"]);
  const additive = binary(multiplicative, ["+", "-"]);
  const comparison = binary(additive, ["==", "!=", ">=", "<=", ">", "<"]);
  const conjunction = binary(comparison, ["&&"]);
  const disjunction = binary(conjunction, ["||"]);

  function conditional() {
    const test = disjunction();
    if (!isOp("?")) return test;
    position += 1;
    const yes = pipeline();
    expect(":");
    return { t: "cond", c: test, a: yes, b: pipeline() };
  }

  function pipeline() {
    let value = conditional();
    while (isOp("|")) {
      position += 1;
      const name = tokens[position++];
      if (name?.type !== "word") throw new Error("Expected a formatter after |");
      value = { t: "call", name: name.value, args: [value, ...(isOp("(") ? args() : [])] };
    }
    return value;
  }

  const tree = pipeline();
  if (position < tokens.length) throw new Error(`Unexpected "${tokens[position].value}"`);
  return tree;
}

const parsed = new Map();
function compile(source) {
  if (!parsed.has(source)) {
    try {
      parsed.set(source, { tree: parse(source) });
    } catch (error) {
      parsed.set(source, { error: error.message });
    }
  }
  return parsed.get(source);
}

export const isEmpty = (value) =>
  value === undefined || value === null || value === "" || (typeof value === "number" && Number.isNaN(value));

export function toNumber(value) {
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  const cleaned = String(value ?? "").replace(/[₹,\s]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

const isNumeric = (value) => !isEmpty(value) && !(value instanceof Date) && Number.isFinite(toNumber(value));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (isEmpty(value)) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const DEFAULT_DATE_FORMAT = "DD MMM YYYY";

export function formatDate(value, format = DEFAULT_DATE_FORMAT) {
  const date = toDate(value);
  if (!date) return "";
  const two = (n) => String(n).padStart(2, "0");
  const parts = {
    YYYY: date.getFullYear(),
    YY: two(date.getFullYear() % 100),
    MMMM: MONTHS_LONG[date.getMonth()],
    MMM: MONTHS[date.getMonth()],
    MM: two(date.getMonth() + 1),
    M: date.getMonth() + 1,
    DD: two(date.getDate()),
    D: date.getDate(),
    ddd: DAYS[date.getDay()],
  };
  return String(format).replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|ddd/g, (token) => parts[token]);
}

const grouped = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export function toText(value) {
  if (isEmpty(value) || typeof value === "boolean") return "";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  return String(value);
}

const truthy = (value) => !isEmpty(value) && value !== false && value !== 0 && value !== "0";

/** Month letter A–L plus the last digit of the year: November 2025 is "K5". */
export function ageCode(value) {
  const date = toDate(value);
  return date ? `${"ABCDEFGHIJKL"[date.getMonth()]}${date.getFullYear() % 10}` : "";
}

export function validCodeWord(word) {
  const letters = String(word ?? "").trim().toUpperCase();
  return letters.length === 10 && new Set(letters).size === 10 && /^[A-Z]+$/.test(letters);
}

/** Cost in letters: the word's letters stand for 1–9 then 0. */
export function costCode(value, word) {
  if (!validCodeWord(word) || !isNumeric(value)) return "";
  const letters = String(word).trim().toUpperCase();
  return String(Math.round(Math.abs(toNumber(value))))
    .split("")
    .map((digit) => letters[(Number(digit) + 9) % 10])
    .join("");
}

const numeric = (fn) => (value, ...rest) => (isNumeric(value) ? fn(toNumber(value), ...rest) : "");
const stepped = (round) => numeric((n, step = 1) => round(n / (toNumber(step) || 1)) * (toNumber(step) || 1));

/** Every formatter usable after | or as a call. `scope` gives shop values and collects warnings. */
export const FORMATTERS = {
  inr: { help: "₹ with Indian grouping", fn: numeric((n) => `₹${grouped.format(n)}`) },
  num: { help: "Indian digit grouping", fn: numeric((n) => grouped.format(n)) },
  round: { help: "round(0) whole, round(-1) to tens", fn: numeric((n, places = 0) => { const f = 10 ** toNumber(places); return Math.round(n * f) / f; }) },
  ceil: { help: "round up, ceil(50) to 50s", fn: stepped(Math.ceil) },
  floor: { help: "round down, floor(10) to 10s", fn: stepped(Math.floor) },
  end9: { help: "round up to end in 9", fn: numeric((n) => (n <= 0 ? n : Math.ceil((Math.round(n) + 1) / 10) * 10 - 1)) },
  abs: { help: "drop the minus sign", fn: numeric(Math.abs) },
  min: { help: "smaller of the two", fn: numeric((n, other) => (isNumeric(other) ? Math.min(n, toNumber(other)) : n)) },
  max: { help: "larger of the two", fn: numeric((n, other) => (isNumeric(other) ? Math.max(n, toNumber(other)) : n)) },
  upper: { help: "UPPERCASE", fn: (v) => toText(v).toUpperCase() },
  lower: { help: "lowercase", fn: (v) => toText(v).toLowerCase() },
  title: { help: "Title Case", fn: (v) => toText(v).toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, gap, letter) => gap + letter.toUpperCase()) },
  first: { help: "first word", fn: (v) => toText(v).trim().split(/\s+/)[0] ?? "" },
  words: { help: "first n words", fn: (v, n = 1) => toText(v).trim().split(/\s+/).slice(0, toNumber(n) || 1).join(" ") },
  truncate: { help: "truncate(12) adds …", fn: (v, n = 12, tail = "…") => { const text = toText(v); const size = toNumber(n) || 12; return text.length > size ? text.slice(0, Math.max(0, size - toText(tail).length)).trimEnd() + toText(tail) : text; } },
  prefix: { help: 'prefix("Size ") when not empty', fn: (v, text = "") => (isEmpty(v) ? "" : toText(text) + toText(v)) },
  suffix: { help: 'suffix(" m") when not empty', fn: (v, text = "") => (isEmpty(v) ? "" : toText(v) + toText(text)) },
  default: { help: 'default("—") when empty', fn: (v, fallback = "") => (isEmpty(v) ? fallback : v) },
  trim: { help: "trim spaces", fn: (v) => toText(v).trim() },
  replace: { help: 'replace("a","b")', fn: (v, from = "", to = "") => toText(v).split(toText(from)).join(toText(to)) },
  pad: { help: "pad(4) → 0007", fn: (v, n = 4, fill = "0") => toText(v).padStart(toNumber(n) || 0, toText(fill) || "0") },
  spaced: { help: "15004 87 style code", fn: (v) => { const text = toText(v); return /^\d{6,}$/.test(text) ? `${text.slice(0, -5)} ${text.slice(-5)}` : text; } },
  date: { help: 'date("DD/MM/YY")', fn: (v, format) => formatDate(v, isEmpty(format) ? undefined : toText(format)) },
  agecode: { help: "month letter + year digit", fn: (v) => ageCode(v) },
  costcode: {
    help: "digits → code word letters",
    fn: (v, _unused, scope) => {
      if (!validCodeWord(scope?.codeWord)) {
        scope?.warn?.("cost-word");
        return "";
      }
      return costCode(v, scope.codeWord);
    },
  },
};

function evaluateNode(node, scope) {
  switch (node.t) {
    case "lit":
      return node.v;
    case "var":
      return scope.get(node.name);
    case "un": {
      const value = evaluateNode(node.a, scope);
      if (node.op === "!") return !truthy(value);
      if (!isNumeric(value)) return "";
      return node.op === "-" ? -toNumber(value) : toNumber(value);
    }
    case "cond":
      return truthy(evaluateNode(node.c, scope)) ? evaluateNode(node.a, scope) : evaluateNode(node.b, scope);
    case "call": {
      const formatter = FORMATTERS[node.name];
      if (!formatter) throw new Error(`Unknown formatter "${node.name}"`);
      const [subject, ...rest] = node.args.map((arg) => evaluateNode(arg, scope));
      return formatter.fn(subject, ...(node.name === "costcode" ? [undefined, scope] : rest));
    }
    case "bin": {
      if (node.op === "&&") {
        const left = evaluateNode(node.a, scope);
        return truthy(left) ? evaluateNode(node.b, scope) : left;
      }
      if (node.op === "||") {
        const left = evaluateNode(node.a, scope);
        return truthy(left) ? left : evaluateNode(node.b, scope);
      }
      const a = evaluateNode(node.a, scope);
      const b = evaluateNode(node.b, scope);
      const bothNumbers = isNumeric(a) && isNumeric(b);
      switch (node.op) {
        case "+":
          if (bothNumbers) return toNumber(a) + toNumber(b);
          return isEmpty(a) && isEmpty(b) ? "" : toText(a) + toText(b);
        case "-":
        case "*":
        case "/":
        case "%": {
          if (!bothNumbers) return "";
          const [x, y] = [toNumber(a), toNumber(b)];
          if ((node.op === "/" || node.op === "%") && y === 0) return "";
          return { "-": x - y, "*": x * y, "/": x / y, "%": x % y }[node.op];
        }
        case "==":
        case "!=": {
          const equal = bothNumbers
            ? toNumber(a) === toNumber(b)
            : toText(a).trim().toLowerCase() === toText(b).trim().toLowerCase();
          return node.op === "==" ? equal : !equal;
        }
        default: {
          if (!bothNumbers) {
            if (isEmpty(a) || isEmpty(b)) return false;
            const [x, y] = [toText(a).toLowerCase(), toText(b).toLowerCase()];
            return { ">": x > y, "<": x < y, ">=": x >= y, "<=": x <= y }[node.op];
          }
          const [x, y] = [toNumber(a), toNumber(b)];
          return { ">": x > y, "<": x < y, ">=": x >= y, "<=": x <= y }[node.op];
        }
      }
    }
    default:
      return "";
  }
}

/** Evaluates one expression; errors are collected on the scope and give an empty value. */
export function evaluate(source, scope) {
  const { tree, error } = compile(String(source ?? "").trim() || '""');
  if (error) {
    scope.errors?.push(error);
    return "";
  }
  try {
    return evaluateNode(tree, scope);
  } catch (caught) {
    scope.errors?.push(caught.message);
    return "";
  }
}

export const isTruthy = truthy;

/** Splits "Save ₹{mrp - price}" into literal text and {expressions}. Quotes may contain braces. */
export function templateParts(text) {
  const parts = [];
  const source = String(text ?? "");
  let literal = "";
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char !== "{") {
      literal += char;
      index += 1;
      continue;
    }
    let end = index + 1;
    let quote = null;
    while (end < source.length && (quote || source[end] !== "}")) {
      if (quote && source[end] === "\\") end += 1;
      else if (quote && source[end] === quote) quote = null;
      else if (!quote && (source[end] === '"' || source[end] === "'")) quote = source[end];
      end += 1;
    }
    if (end >= source.length) {
      literal += source.slice(index);
      break;
    }
    if (literal) parts.push({ text: literal });
    literal = "";
    parts.push({ expr: source.slice(index + 1, end) });
    index = end + 1;
  }
  if (literal) parts.push({ text: literal });
  return parts;
}

export function renderTemplate(text, scope) {
  return templateParts(text)
    .map((part) => (part.expr === undefined ? part.text : toText(evaluate(part.expr, scope))))
    .join("");
}

/** Variable names an expression or template refers to, for rename and "unused" hints. */
export function referencedNames(source, { template = false } = {}) {
  const names = new Set();
  const visit = (node) => {
    if (!node) return;
    if (node.t === "var") names.add(node.name);
    ["a", "b", "c"].forEach((key) => visit(node[key]));
    node.args?.forEach(visit);
  };
  const expressions = template ? templateParts(source).filter((p) => p.expr !== undefined).map((p) => p.expr) : [source];
  expressions.forEach((expression) => visit(compile(String(expression ?? "").trim() || '""').tree));
  return names;
}

/** Renames a variable inside a template or expression without touching quoted text. */
export function renameInSource(source, from, to, { template = false } = {}) {
  const swap = (expression) =>
    expression.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b([A-Za-z_][\w.]*)\b/g, (match, quoted, word) =>
      quoted ? quoted : word === from ? to : match
    );
  if (!template) return swap(String(source ?? ""));
  return templateParts(source)
    .map((part) => (part.expr === undefined ? part.text : `{${swap(part.expr)}}`))
    .join("");
}
