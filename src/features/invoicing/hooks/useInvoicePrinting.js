import { useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import { BUSINESS } from "@/config/business";

const PRINT_WINDOW_FEATURES = "left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0";
const PRINT_DELAY_MS = 1500;

const PRINT_STYLES = `
  body { font-family: Arial, sans-serif; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background-color: #f2f2f2; }
  @media print { body { -webkit-print-color-adjust: exact; } }
`;

/**
 * Renders an element to static markup in a popup and triggers the browser's
 * print dialog. Returns false when the popup was blocked.
 */
export function usePrintDocument() {
  return useCallback((element, title = `${BUSINESS.name} Bill`) => {
    const printWindow = window.open("", "", PRINT_WINDOW_FEATURES);
    if (!printWindow) return false;

    printWindow.document.write(
      `<html><head><title>${title}</title><style>${PRINT_STYLES}</style></head>` +
        `<body>${ReactDOMServer.renderToStaticMarkup(element)}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), PRINT_DELAY_MS);
    return true;
  }, []);
}
