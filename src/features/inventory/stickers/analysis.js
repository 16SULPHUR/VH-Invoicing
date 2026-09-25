import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { encodeBarcode } from "./barcode";
import { renderTemplate } from "./expr";
import { textContent } from "./labelText";
import { fitText } from "./textFit";
import { conditionHolds } from "./variables";

const MIN_TEXT_PT = 5;
const qrModules = new Map();

function qrModuleCount(value, level) {
  const key = `${level}|${value}`;
  if (!qrModules.has(key)) {
    const markup = renderToStaticMarkup(createElement(QRCodeSVG, { value: value || " ", level, marginSize: 0 }));
    qrModules.set(key, Number(markup.match(/viewBox="0 0 (\d+)/)?.[1]) || 21);
  }
  return qrModules.get(key);
}

const dots = (lengthMm, dpi) => (lengthMm * dpi) / 25.4;
const fixed = (value) => Math.round(value * 100) / 100;

/**
 * What may not print well at this resolution: strokes under one dot, text under ~5 pt,
 * bars and QR modules too fine to scan, objects off the label, and value problems.
 */
export function printChecks(design, scope, dpi) {
  const checks = [];
  const dot = 25.4 / dpi;
  const add = (element, level, message) => checks.push({ id: element?.id ?? null, name: element?.name ?? "Design", level, message });
  const { width, height } = design.size;

  design.elements.forEach((element) => {
    if (element.hidden || element.guide || !conditionHolds(element.condition, scope)) return;
    const { x, y, w, h } = element;
    if (x < -0.05 || y < -0.05 || x + w > width + 0.05 || y + h > height + 0.05) {
      if (!(element.type === "box" && element.fill === "black")) add(element, "warn", "Runs off the edge of the label");
    }
    switch (element.type) {
      case "text": {
        const { size, clipped } = fitText(textContent(element, scope), element);
        if (size < MIN_TEXT_PT) add(element, "warn", `Text is ${fixed(size)} pt; under 5 pt can smudge on a thermal head`);
        if (clipped) add(element, "info", "Too long for its box, so it ends with …");
        break;
      }
      case "line":
        if (Math.min(w, h) < dot) add(element, "error", `Line is ${fixed(Math.min(w, h))} mm, thinner than one printer dot (${fixed(dot)} mm)`);
        break;
      case "box":
      case "ellipse":
        if (element.fill === "none" && element.strokeWidth > 0 && element.strokeWidth < dot) {
          add(element, "error", `Outline is ${fixed(element.strokeWidth)} mm, thinner than one printer dot (${fixed(dot)} mm)`);
        }
        break;
      case "barcode": {
        const { modules, error } = encodeBarcode(element.symbology, renderTemplate(element.value, scope));
        if (error) {
          add(element, "error", error);
          break;
        }
        const bar = dots(w / modules, dpi);
        const crisp = Math.max(1, Math.round(bar));
        if (bar < 1) add(element, "error", `Bars are ${fixed(bar)} dots wide; make it at least ${fixed((modules * dot))} mm wide`);
        else if (Math.abs(bar - crisp) > 0.08) add(element, "info", `For even bars, set the width to ${fixed(modules * crisp * dot)} mm (${crisp} dots per bar)`);
        break;
      }
      case "qr": {
        const modules = qrModuleCount(renderTemplate(element.value, scope), element.ecLevel ?? "M");
        const cell = dots(Math.min(w, h) / modules, dpi);
        if (cell < 2) add(element, cell < 1 ? "error" : "warn", `QR squares are ${fixed(cell)} dots; below 2 may not scan. Make it larger or shorten the value`);
        break;
      }
      default:
    }
  });

  if (scope.warnings.has("cost-word")) add(null, "warn", "Cost code needs a code word. Set it under Shop values");
  scope.missing.forEach((name) => add(null, "warn", `Unknown value "${name}"`));
  [...new Set(scope.errors)].forEach((message) => add(null, "error", message));
  return checks;
}
