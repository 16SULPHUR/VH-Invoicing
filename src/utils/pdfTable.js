// Built-in PDF fonts have no ₹ or Unicode minus.
const clean = (value) => String(value ?? "").replace(/₹\s?/g, "").replace(/−/g, "-");

/** A4 landscape table PDF with repeated header and an optional bold totals row. */
export async function downloadPdfTable({ filename, title, subtitle, headers, rows, aligns = [], footer }) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const rowHeight = 15;
  const pad = 4;
  const fontSize = 8;

  const head = headers.map(clean);
  const body = rows.map((row) => row.map(clean));
  const foot = footer?.map(clean);

  doc.setFontSize(fontSize);
  const widths = head.map((h, i) => {
    doc.setFont("helvetica", "bold");
    let max = doc.getTextWidth(h);
    doc.setFont("helvetica", "normal");
    for (const row of body) max = Math.max(max, doc.getTextWidth(row[i]));
    if (foot) {
      doc.setFont("helvetica", "bold");
      max = Math.max(max, doc.getTextWidth(foot[i]));
    }
    return max + pad * 2 + 2;
  });
  const scale = (pageWidth - margin * 2) / widths.reduce((a, b) => a + b, 0);
  const cols = widths.map((w) => w * scale);
  if (scale < 1) doc.setFontSize(fontSize * Math.max(scale, 0.7));

  const drawRow = (cells, y, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    let x = margin;
    cells.forEach((cell, i) => {
      const right = aligns[i] === "right";
      const text = doc.splitTextToSize(cell, cols[i] - pad * 2)[0] ?? "";
      doc.text(text, right ? x + cols[i] - pad : x + pad, y + rowHeight - 5, { align: right ? "right" : "left" });
      x += cols[i];
    });
  };
  const line = (y, width = 0.5) => {
    doc.setLineWidth(width);
    doc.line(margin, y, pageWidth - margin, y);
  };

  let page = 1;
  const startPage = () => {
    const size = doc.getFontSize();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(clean(title), margin, margin + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(clean(`${subtitle ?? ""}${subtitle ? "  ·  " : ""}Amounts in Rs  ·  Page ${page}`), margin, margin + 20);
    doc.setFontSize(size);
    const y = margin + 30;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, rowHeight, "F");
    drawRow(head, y, true);
    line(y + rowHeight);
    return y + rowHeight;
  };

  let y = startPage();
  const bottom = pageHeight - margin;
  for (const row of body) {
    if (y + rowHeight > bottom) {
      doc.addPage();
      page += 1;
      y = startPage();
    }
    drawRow(row, y, false);
    y += rowHeight;
    doc.setDrawColor(225);
    line(y, 0.3);
    doc.setDrawColor(0);
  }
  if (foot) {
    if (y + rowHeight > bottom) {
      doc.addPage();
      page += 1;
      y = startPage();
    }
    line(y, 1);
    drawRow(foot, y, true);
    line(y + rowHeight, 1);
  }

  doc.save(filename);
}
