import { renderTemplate } from "./expr";

export const round = (value) => Math.round((Number(value) || 0) * 1000) / 1000;

/** A length in the label's --mm unit, so one layout serves the screen at any zoom and paper. */
export const mm = (value) => `calc(var(--mm) * ${round(value)})`;

export function textContent(element, scope) {
  const text = renderTemplate(element.text, scope);
  return element.uppercase ? text.toUpperCase() : text;
}
