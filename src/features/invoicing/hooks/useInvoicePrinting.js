import { useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import { BUSINESS } from "@/config/business";

const PRINT_WINDOW_FEATURES = "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0";
const PRINT_DELAY_MS = 1500;

const printStyles = (pageSize) => `
  @page { size: ${pageSize}; margin: 0; }
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

// A hidden frame needs no pop-up permission, so it can print without a click on this
// computer (bills sent from a phone).
function openPrintFrame() {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const target = frame.contentWindow;
  const remove = () => setTimeout(() => frame.remove(), 1000);
  target.addEventListener("afterprint", remove);
  setTimeout(remove, 5 * 60 * 1000);
  return target;
}

/**
 * Renders an element to static markup in a popup (or a hidden frame with `frame: true`)
 * and triggers the browser's print dialog. Returns false when the popup was blocked.
 */
export function usePrintDocument() {
  return useCallback(
    (
      element,
      { title = `${BUSINESS.name} Bill`, pageSize = "A5 portrait", fonts = [], frame = false } = {}
    ) => {
      const printWindow = frame ? openPrintFrame() : window.open("", "", PRINT_WINDOW_FEATURES);
      if (!printWindow) return false;

      printWindow.document.write(
        `<html><head><title>${title}</title><style>${fontFaces()}${printStyles(pageSize)}</style></head>` +
          `<body>${ReactDOMServer.renderToStaticMarkup(element)}</body></html>`
      );
      printWindow.document.close();
      if (!frame) printWindow.focus();
      const doc = printWindow.document;
      const ready = Promise.all([
        ...[...PRINT_FONTS, ...fonts].map((font) => doc.fonts.load(font).catch(() => null)),
        ...[...doc.images].map(
          (image) =>
            image.complete || new Promise((resolve) => (image.onload = image.onerror = resolve))
        ),
      ]).then(() => {
        doc.body.getBoundingClientRect();
        return doc.fonts.ready;
      });
      Promise.race([ready, new Promise((resolve) => setTimeout(resolve, PRINT_DELAY_MS))]).then(
        () => setTimeout(() => printWindow.print(), 150)
      );
      return true;
    },
    []
  );
}
