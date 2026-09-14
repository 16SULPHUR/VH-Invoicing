import { useCallback } from "react";
import ReactDOMServer from "react-dom/server";
import { BUSINESS } from "@/config/business";
import { PrintableInvoice } from "../components/PrintableInvoice";
import { parseInvoiceLines } from "@/utils/invoice";
import { formatInvoiceDate } from "@/utils/date";

/**
 * Rasterises an invoice into a one-page PDF and hands it to the Web Share API,
 * falling back to a download where sharing files is unsupported.
 */
export function useShareInvoicePdf() {
  return useCallback(async (invoice) => {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    const host = document.createElement("div");
    host.style.position = "absolute";
    host.style.left = "-9999px";
    host.innerHTML = ReactDOMServer.renderToStaticMarkup(
      <PrintableInvoice
        invoiceId={invoice.id}
        invoiceDate={formatInvoiceDate(invoice.date)}
        customerName={invoice.customerName}
        customerContact={invoice.customerNumber}
        products={parseInvoiceLines(invoice.products)}
        total={invoice.total}
        note={invoice.note}
      />
    );
    document.body.appendChild(host);

    try {
      const canvas = await html2canvas(host, { scale: 2 });
      const pdf = new jsPDF("p", "mm", "a4");
      const imageData = canvas.toDataURL("image/png");
      const { width, height } = pdf.getImageProperties(imageData);
      const pdfWidth = pdf.internal.pageSize.getWidth();

      pdf.addImage(imageData, "PNG", 0, 0, pdfWidth, (height * pdfWidth) / width);

      const fileName = `invoice-${invoice.id}.pdf`;
      const file = new File([pdf.output("blob")], fileName, { type: "application/pdf" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${BUSINESS.name} Invoice`,
          text: `Invoice for ${invoice.customerName}, Amount: ₹${invoice.total}`,
          files: [file],
        });
      } else {
        pdf.save(fileName);
      }
    } finally {
      host.remove();
    }
  }, []);
}
