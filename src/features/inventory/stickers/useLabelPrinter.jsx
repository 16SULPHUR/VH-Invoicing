import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePrintDocument } from "@/features/invoicing/hooks/useInvoicePrinting";
import { AlignmentTestSheet, LabelPrintSheet } from "./LabelRenderer";
import { fontSpec, loadFonts } from "./fonts";
import { A4 } from "./labelStock";
import { usePrinterSettings } from "./printerSettings";

const pageSizeOf = (size) => (size.stock === "sheet" ? `${A4.width}mm ${A4.height}mm` : `${size.width}mm ${size.height}mm`);

/** Prints stickers (or an alignment test) through the shared print window, with this device's offset. */
export function useLabelPrinter() {
  const printDocument = usePrintDocument();
  const printer = usePrinterSettings();
  const { toast } = useToast();

  const open = useCallback(
    (element, size, fonts = []) => {
      const opened = printDocument(element, { title: "Variety Heaven stickers", pageSize: pageSizeOf(size), fonts });
      if (!opened) {
        toast({ title: "Print blocked", description: "Allow pop-ups for this site to print stickers.", variant: "destructive" });
      }
      return opened;
    },
    [printDocument, toast]
  );

  const printLabels = useCallback(
    async (labels, { startAt = 0 } = {}) => {
      if (labels.length === 0) return false;
      const designs = [...new Map(labels.map(({ design }) => [design.id, design])).values()];
      const elements = designs.flatMap((design) => design.elements);
      await loadFonts(elements, labels.slice(0, 50).map(({ product }) => product?.name ?? ""));
      const fonts = [...new Set(elements.filter((element) => element.type === "text").map((element) => fontSpec(element, 10)))];
      return open(<LabelPrintSheet labels={labels} offset={printer} startAt={startAt} />, labels[0].design.size, fonts);
    },
    [open, printer]
  );

  const printTest = useCallback((size) => open(<AlignmentTestSheet size={size} offset={printer} />, size), [open, printer]);

  return { printLabels, printTest, printer };
}
