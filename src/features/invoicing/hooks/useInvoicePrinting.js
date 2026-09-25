import { useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import { BUSINESS } from "@/config/business";

const PRINT_WINDOW_FEATURES = "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0";
const PRINT_DELAY_MS = 1500;

const PRINT_STYLES = `
  @page { size: A5 portrait; margin: 0; }
  body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

const PRINT_FONTS = [
  '400 10px "Hanken Grotesk Variable"',
  '800 10px "Hanken Grotesk Variable"',
  '800 10px "Bricolage Grotesque Variable"',
];

/** The app's bundled fonts, so the popup prints in the same type without a network fetch. */
function fontFaces() {
  return [...document.styleSheets]
    .flatMap((sheet) => {
      try {
        return [...sheet.cssRules];
      } catch {
        return [];
      }
    })
    .filter((rule) => rule instanceof CSSFontFaceRule)
    .map((rule) => rule.cssText)
    .join("\n");
}

/**
 * Renders an element to static markup in a popup and triggers the browser's
 * print dialog. Returns false when the popup was blocked.
 */
export function usePrintDocument() {
  return useCallback((element, title = `${BUSINESS.name} Bill`) => {
    const printWindow = window.open("", "", PRINT_WINDOW_FEATURES);
    if (!printWindow) return false;

    printWindow.document.write(
      `<html><head><title>${title}</title><style>${fontFaces()}${PRINT_STYLES}</style></head>` +
        `<body>${ReactDOMServer.renderToStaticMarkup(element)}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    const doc = printWindow.document;
    const ready = Promise.all([
      ...PRINT_FONTS.map((font) => doc.fonts.load(font).catch(() => null)),
      ...[...doc.images].map(
        (image) => image.complete || new Promise((resolve) => (image.onload = image.onerror = resolve))
      ),
    ]);
    Promise.race([ready, new Promise((resolve) => setTimeout(resolve, PRINT_DELAY_MS))]).then(() =>
      setTimeout(() => printWindow.print(), 150)
    );
    return true;
  }, []);
}
