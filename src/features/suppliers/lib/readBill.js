const OWN_GSTIN = "24GGEPP0013E1ZZ";
const MAX_SIDE = 2200;
const GSTIN = /\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]\b/g;

const number = (text) => Number(String(text).replace(/,/g, ""));

function toISO(day, month, year) {
  const y = year.length === 2 ? `20${year}` : year;
  const d = Number(day);
  const m = Number(month);
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Pulls the usual invoice fields out of OCR text; anything not found stays null. */
export function parseBillText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const flat = lines.join("\n");

  const gstins = [...flat.toUpperCase().matchAll(GSTIN)].map((match) => match[0]);
  const gstin = gstins.find((value) => value !== OWN_GSTIN) ?? null;

  const supplierLine = lines.slice(0, 8).find((line) => /[A-Za-z]{4,}/.test(line) && !/invoice|bill of|gstin|original|duplicate|tax|cash memo/i.test(line));

  const billNo = flat.match(/(?:invoice|bill|inv|memo)\s*(?:no|number|num|#)\.?\s*[:\-.]?\s*([A-Z0-9][A-Z0-9/-]{0,18})/i)?.[1] ?? null;

  const dateMatch = flat.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})\b/);
  const billDate = dateMatch ? toISO(dateMatch[1], dateMatch[2], dateMatch[3]) : null;

  const totals = [...flat.matchAll(/(?:grand\s*total|net\s*(?:amount|payable)|total\s*amount|invoice\s*(?:value|total|amount)|total)[^\d\n]{0,12}([\d,]+(?:\.\d{1,2})?)/gi)]
    .map((match) => number(match[1]))
    .filter((value) => value > 0);
  const total = totals.length ? Math.max(...totals) : null;

  const hsn = flat.match(/HSN[^\d\n]{0,15}(\d{4,8})/i)?.[1] ?? null;

  const rates = [...flat.matchAll(/(?:cgst|sgst|igst)[^\d\n]{0,12}(\d+(?:\.\d+)?)\s*%?/gi)].map((match) => number(match[1]));
  let gstRate = null;
  if (rates.length) gstRate = /igst/i.test(flat) && rates.length === 1 ? rates[0] : rates.length >= 2 ? rates[0] * 2 : rates[0];

  return {
    supplier_name: supplierLine ?? null,
    gstin,
    bill_no: billNo,
    bill_date: billDate,
    taxable_amount: null,
    gst_rate: [0, 5, 12, 18].includes(gstRate) ? gstRate : null,
    hsn,
    total,
    items: [],
    notes: "Read on this device from the photo. Check every number against the paper bill; handwriting is often misread.",
  };
}

async function toCanvasBlob(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(2, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.filter = "grayscale(1) contrast(1.3)";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Reads the bill photo in the browser (no account or key) and returns what it found; nothing is saved. */
export async function readSupplierBill(file, onProgress) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (message) => message.status === "recognizing text" && onProgress?.(message.progress),
  });
  try {
    const { data } = await worker.recognize(await toCanvasBlob(file));
    return parseBillText(data.text);
  } finally {
    await worker.terminate();
  }
}
