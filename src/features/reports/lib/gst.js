import { normName } from "./lines";

export const GST_DEFAULTS = {
  gstin: "24GGEPP0013E1ZZ",
  stateCode: "24",
  stateName: "Gujarat",
  scheme: "regular",
  defaultHsn: "5407",
  defaultDescription: "Sarees and dress material",
  defaultRate: 5,
  uqc: "PCS",
  frequency: "quarterly",
  hsnCodes: [
    { code: "5407", description: "Sarees and dress material", rate: 5 },
    { code: "6204", description: "Petticoats and women's garments", rate: "garment" },
    { code: "6206", description: "Blouses", rate: "garment" },
  ],
  itemHsn: {},
  rules: [],
  itc: {},
};

export const DOC_NATURE = "Invoices for outward supply";
export const CREDIT_NOTE_NATURE = "Credit Note";

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const SLAB_CHANGE = new Date("2025-09-22T00:00:00+05:30");

/** Ready-made garments: 5% up to a price per piece, higher above it (₹1,000 / 12% before 22 Sep 2025, ₹2,500 / 18% after). */
export function garmentRate(unitPrice, date = new Date()) {
  const [limit, high] = date < SLAB_CHANGE ? [1000, 12] : [2500, 18];
  return Math.abs(unitPrice) <= limit ? 5 : high;
}

export const rateLabel = (rate) => (rate === "garment" ? "5% or 18% by price" : `${rate}%`);

/** The HSN picked for the item wins, then the first keyword rule, then the default. */
export function taxFor(line, settings, date) {
  const upper = normName(line.name);
  const code = settings.itemHsn?.[upper];
  const rule = code ? null : (settings.rules ?? []).find((r) => r.match && upper.includes(normName(r.match)));
  const hsn = String(code || rule?.hsn || settings.defaultHsn);
  const known = (settings.hsnCodes ?? []).find((c) => String(c.code) === hsn);
  const rawRate = rule?.rate ?? known?.rate ?? settings.defaultRate;
  return {
    hsn,
    description: rule?.description || known?.description || (hsn === String(settings.defaultHsn) ? settings.defaultDescription : ""),
    rate: rawRate === "garment" ? garmentRate(line.price, date) : Number(rawRate) || 0,
    ruled: Boolean(code || rule),
    slab: rawRate === "garment",
  };
}

/** Prices on the bill include GST, so tax is taken out of the amount rather than added on. */
export function splitInclusive(amount, rate) {
  const taxable = amount / (1 + rate / 100);
  const tax = amount - taxable;
  return { taxable, tax, cgst: tax / 2, sgst: tax / 2 };
}

function financialYearOf(date) {
  const year = date.getFullYear();
  return date.getMonth() < 3 ? `${year - 1}-${String(year).slice(2)}` : `${year}-${String(year + 1).slice(2)}`;
}

/** Bill numbers restart each April, so gaps are found per financial year. */
export function documentsIssued(bills) {
  const byYear = new Map();
  for (const bill of bills) {
    const fy = financialYearOf(bill.date);
    if (!byYear.has(fy)) byYear.set(fy, new Set());
    byYear.get(fy).add(Number(bill.id));
  }
  return [...byYear.entries()].map(([fy, idSet]) => {
    const ids = [...idSet].sort((a, b) => a - b);
    const from = ids[0];
    const to = ids[ids.length - 1];
    const missing = [];
    for (let n = from, i = 0; n <= to; n += 1) {
      if (ids[i] === n) i += 1;
      else missing.push(n);
    }
    const total = to - from + 1;
    return { fy, from, to, total, cancelled: missing.length, issued: total - missing.length, missing };
  });
}

/** Credit notes from the counter: goods taken back without a bill, so they reduce sales like a return line. */
export function creditNoteDocs(notes) {
  return notes.map((note) => ({
    id: note.token,
    date: new Date(note.created_at),
    customerName: note.customer_name,
    total: -Number(note.amount || 0),
    adjustments: 0,
    void: note.status === "void",
    lines: (note.lines ?? []).map((line) => {
      const quantity = Math.abs(Number(line.quantity) || 1);
      return { name: normName(line.name), price: Number(line.price) || 0, quantity: -quantity, amount: -(Number(line.price) || 0) * quantity, kind: "return" };
    }),
  }));
}

function creditNoteSeries(notes) {
  if (!notes.length) return [];
  const numbers = notes.map((n) => Number(String(n.id).replace(/\D/g, ""))).filter(Number.isFinite).sort((a, b) => a - b);
  if (!numbers.length) return [];
  const from = numbers[0];
  const to = numbers[numbers.length - 1];
  const cancelled = notes.filter((n) => n.void).length;
  const total = to - from + 1;
  return [{ from: `CN${from}`, to: `CN${to}`, total, cancelled: total - numbers.length + cancelled, issued: numbers.length - cancelled }];
}

export function computeGst(bills, settings, creditNotes = []) {
  const composition = settings.scheme === "composition";
  const rates = new Map();
  const hsn = new Map();
  const register = [];
  let defaultedLines = 0;

  const notes = creditNotes.filter((n) => !n.void);
  for (const bill of [...bills, ...notes]) {
    const row = { id: bill.id, date: bill.date, customer: bill.customerName || "Walk-in", value: 0, taxable: 0, cgst: 0, sgst: 0, adjustments: bill.adjustments, total: bill.total, rates: new Set() };
    for (const line of bill.lines) {
      if (line.kind === "adjustment") continue;
      const tax = taxFor(line, settings, bill.date);
      if (!tax.ruled) defaultedLines += 1;
      const rate = composition ? 0 : tax.rate;
      const split = splitInclusive(line.amount, rate);

      const r = rates.get(rate) ?? { rate, value: 0, taxable: 0, cgst: 0, sgst: 0 };
      r.value += line.amount;
      r.taxable += split.taxable;
      r.cgst += split.cgst;
      r.sgst += split.sgst;
      rates.set(rate, r);

      const hsnKey = `${tax.hsn}|${rate}`;
      const h = hsn.get(hsnKey) ?? { hsn: tax.hsn, description: tax.description, rate, quantity: 0, value: 0, taxable: 0, cgst: 0, sgst: 0 };
      h.quantity += line.quantity;
      h.value += line.amount;
      h.taxable += split.taxable;
      h.cgst += split.cgst;
      h.sgst += split.sgst;
      hsn.set(hsnKey, h);

      row.value += line.amount;
      row.taxable += split.taxable;
      row.cgst += split.cgst;
      row.sgst += split.sgst;
      row.rates.add(rate);
    }
    register.push({ ...row, rates: [...row.rates].join(", ") });
  }

  const roundRow = (row) => ({
    ...row,
    value: round2(row.value),
    taxable: round2(row.taxable),
    cgst: round2(row.cgst),
    sgst: round2(row.sgst),
  });

  const b2cs = [...rates.values()].map(roundRow).sort((a, b) => a.rate - b.rate);
  const hsnRows = [...hsn.values()].map(roundRow).sort((a, b) => b.value - a.value);
  const summary = b2cs.reduce(
    (acc, row) => ({
      value: acc.value + row.value,
      taxable: acc.taxable + row.taxable,
      cgst: acc.cgst + row.cgst,
      sgst: acc.sgst + row.sgst,
    }),
    { value: 0, taxable: 0, cgst: 0, sgst: 0 }
  );

  const turnover = round2(summary.value);
  return {
    composition,
    b2cs,
    hsn: hsnRows,
    register: register.map(roundRow),
    documents: documentsIssued(bills),
    creditNoteDocs: creditNoteSeries(creditNotes),
    summary: { ...summary, value: turnover, taxable: round2(summary.taxable), cgst: round2(summary.cgst), sgst: round2(summary.sgst), tax: round2(summary.cgst + summary.sgst) },
    cmp08: { turnover, cgst: round2(turnover * 0.005), sgst: round2(turnover * 0.005) },
    defaultedLines,
  };
}

/** Net tax to pay after input credit, component by component; unused credit carries forward. */
export function netPayable(summary, itc = {}) {
  const cgstItc = Number(itc.cgst) || 0;
  const sgstItc = Number(itc.sgst) || 0;
  const igstItc = Number(itc.igst) || 0;
  // IGST credit is used against CGST first, then SGST.
  const igstToCgst = Math.min(igstItc, summary.cgst);
  const igstToSgst = Math.min(igstItc - igstToCgst, summary.sgst);
  const cgst = Math.max(0, summary.cgst - igstToCgst - cgstItc);
  const sgst = Math.max(0, summary.sgst - igstToSgst - sgstItc);
  return { cgst: round2(cgst), sgst: round2(sgst), total: round2(cgst + sgst) };
}

/** GSTR-1 return period: the last month of the chosen month or quarter, as MMYYYY. */
export function returnPeriod(to) {
  const [year, month] = to.split("-");
  return `${month}${year}`;
}

export function gstr1Json(gst, settings, period) {
  const pos = settings.stateCode;
  const byFy = gst.documents.filter((doc) => doc.total > 0);
  return {
    gstin: settings.gstin,
    fp: period,
    version: "GST3.2.2",
    hash: "hash",
    b2cs: gst.b2cs
      .filter((row) => row.taxable !== 0)
      .map((row) => ({ sply_ty: "INTRA", pos, typ: "OE", rt: row.rate, txval: row.taxable, iamt: 0, camt: row.cgst, samt: row.sgst, csamt: 0 })),
    hsn: {
      hsn_b2c: gst.hsn.map((row, i) => ({
        num: i + 1,
        hsn_sc: row.hsn,
        desc: row.description,
        uqc: settings.uqc,
        qty: row.quantity,
        rt: row.rate,
        txval: row.taxable,
        iamt: 0,
        camt: row.cgst,
        samt: row.sgst,
        csamt: 0,
      })),
    },
    doc_issue: {
      doc_det: [
        {
          doc_num: 1,
          doc_typ: DOC_NATURE,
          docs: byFy.map((doc, i) => ({
            num: i + 1,
            from: String(doc.from),
            to: String(doc.to),
            totnum: doc.total,
            cancel: doc.cancelled,
            net_issue: doc.issued,
          })),
        },
        ...(gst.creditNoteDocs.length
          ? [
              {
                doc_num: 5,
                doc_typ: CREDIT_NOTE_NATURE,
                docs: gst.creditNoteDocs.map((doc, i) => ({ num: i + 1, from: doc.from, to: doc.to, totnum: doc.total, cancel: doc.cancelled, net_issue: doc.issued })),
              },
            ]
          : []),
      ],
    },
  };
}

const UQC_LABEL = { PCS: "PCS-PIECES", MTR: "MTR-METERS", NOS: "NOS-NUMBERS", SET: "SET-SETS" };

/** Column layouts of the GST offline tool's CSV templates. */
export function offlineToolCsv(gst, settings) {
  const pos = `${settings.stateCode}-${settings.stateName}`;
  return {
    b2cs: {
      headers: ["Type", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
      rows: gst.b2cs.filter((r) => r.taxable !== 0).map((r) => ["OE", pos, "", r.rate, r.taxable.toFixed(2), "0.00", ""]),
    },
    hsn: {
      headers: ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Rate", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"],
      rows: gst.hsn.map((r) => [r.hsn, r.description, UQC_LABEL[settings.uqc] ?? settings.uqc, r.quantity, r.value.toFixed(2), r.rate, r.taxable.toFixed(2), "0.00", r.cgst.toFixed(2), r.sgst.toFixed(2), "0.00"]),
    },
    docs: {
      headers: ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],
      rows: [
        ...gst.documents.map((d) => [DOC_NATURE, d.from, d.to, d.total, d.cancelled]),
        ...gst.creditNoteDocs.map((d) => [CREDIT_NOTE_NATURE, d.from, d.to, d.total, d.cancelled]),
      ],
    },
  };
}
