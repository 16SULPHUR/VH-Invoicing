import { fontSpec, fontsVersion } from "./fonts";

export const PT = 25.4 / 72;
const MEASURE_PX = 100;
const STEP_PT = 0.25;
const SLACK = 0.985;

let context = null;
const widths = new Map();

/** Width in mm of one line at the given size, including letter spacing. */
function lineWidth(text, element, sizePt) {
  if (!text) return 0;
  if (!context) {
    if (typeof document === "undefined") return text.length * sizePt * PT * 0.55;
    context = document.createElement("canvas").getContext("2d");
  }
  const font = fontSpec(element, MEASURE_PX);
  const key = `${fontsVersion.get()}|${font}|${text}`;
  if (!widths.has(key)) {
    if (widths.size > 20_000) widths.clear();
    context.font = font;
    widths.set(key, context.measureText(text).width / MEASURE_PX);
  }
  const em = sizePt * PT;
  return widths.get(key) * em + (Number(element.letterSpacing) || 0) * em * [...text].length;
}

function breakWord(word, element, size, width) {
  const pieces = [];
  let piece = "";
  for (const char of [...word]) {
    if (piece && lineWidth(piece + char, element, size) > width) {
      pieces.push(piece);
      piece = char;
    } else piece += char;
  }
  if (piece) pieces.push(piece);
  return pieces;
}

function wrap(text, element, size, width) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/ +/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (lineWidth(candidate, element, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      const pieces = lineWidth(word, element, size) > width ? breakWord(word, element, size, width) : [word];
      line = pieces.pop() ?? "";
      lines.push(...pieces);
    }
    lines.push(line);
  }
  return lines;
}

function ellipsize(text, element, size, width) {
  const cut = [...text.trimEnd()];
  while (cut.length > 0 && lineWidth(`${cut.join("").trimEnd()}…`, element, size) > width) cut.pop();
  return `${cut.join("").trimEnd()}…`;
}

/**
 * Lays text into the object's box: shrink from the font size toward the minimum, wrap
 * up to the line limit (or as many lines as the height allows), then end with an ellipsis.
 */
export function fitText(text, element) {
  const size = Number(element.fontSize) || 8;
  const minSize = Math.min(size, Number(element.minSize) || size);
  const width = Math.max(0.1, Number(element.w) * SLACK);
  const lineHeight = Number(element.lineHeight) || 1.15;
  const maxLines = Math.max(1, Math.floor(Number(element.maxLines) || 1));
  const allowedLines = (candidate) =>
    Math.max(1, Math.min(maxLines, Math.floor(Number(element.h) / (candidate * PT * lineHeight) + 0.02)));

  if (!text) return { lines: [], size, clipped: false };

  for (let candidate = size; candidate >= minSize - 1e-6; candidate = Math.round((candidate - STEP_PT) * 100) / 100) {
    const lines = wrap(text, element, candidate, width);
    if (lines.length <= allowedLines(candidate)) return { lines, size: candidate, clipped: false };
  }

  const limit = allowedLines(minSize);
  const lines = wrap(text, element, minSize, width);
  if (lines.length <= limit) return { lines, size: minSize, clipped: false };
  const kept = lines.slice(0, limit);
  const rest = lines.slice(limit - 1).join(" ");
  kept[limit - 1] = ellipsize(rest, element, minSize, width);
  return { lines: kept, size: minSize, clipped: true };
}
