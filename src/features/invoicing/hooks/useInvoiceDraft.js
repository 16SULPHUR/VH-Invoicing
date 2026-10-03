import { useCallback, useEffect, useMemo, useState } from "react";
import { invoiceItemCount, invoiceTotal, lineAmount, parseInvoiceLines } from "@/utils/invoice";
import { formatAmount } from "@/utils/formatters";

const EMPTY_LINE_FORM = { name: "", price: "", quantity: "", mrp: "" };
const EMPTY_PAYMENTS = { cash: "", upi: "", credit: "" };

function readSaved(key) {
  if (!key) return null;
  try {
    const saved = JSON.parse(localStorage.getItem(key)) ?? null;
    return saved?.editingInvoice ? null : saved;
  } catch {
    return null;
  }
}

function writeSaved(key, value) {
  if (!key) return;
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    // Storage can be full or blocked; the draft still works in memory.
  }
}

/**
 * Owns the invoice currently being written at the till: its customer, lines,
 * payments and note, plus whether it is a new invoice or an edit of an old one.
 */
export function useInvoiceDraft({ persistKey } = {}) {
  const [saved] = useState(() => readSaved(persistKey));
  const [customerName, setCustomerName] = useState(saved?.customerName ?? "");
  const [customerNumber, setCustomerNumber] = useState(saved?.customerNumber ?? "");
  const [lines, setLines] = useState(saved?.lines ?? []);
  const [note, setNote] = useState(saved?.note ?? "");
  const [payments, setPayments] = useState(saved?.payments ?? EMPTY_PAYMENTS);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [lineForm, setLineForm] = useState(EMPTY_LINE_FORM);
  const [editingLineIndex, setEditingLineIndex] = useState(null);

  const [editingInvoice, setEditingInvoice] = useState(null);

  // A new bill survives leaving the billing screen; an edit never does, so the till
  // does not reopen stuck on an old bill. Cleared once the bill is printed or reset.
  useEffect(() => {
    const isEmpty =
      !!editingInvoice ||
      lines.length === 0 &&
      !customerName &&
      !customerNumber &&
      !note &&
      !payments.cash &&
      !payments.upi &&
      !payments.credit;
    writeSaved(
      persistKey,
      isEmpty ? null : { customerName, customerNumber, lines, note, payments }
    );
  }, [persistKey, customerName, customerNumber, lines, note, payments, editingInvoice]);

  const total = useMemo(() => formatAmount(invoiceTotal(lines)), [lines]);
  const itemCount = useMemo(() => invoiceItemCount(lines), [lines]);

  const setPayment = useCallback((method, value) => {
    setPayments((prev) => ({ ...prev, [method]: value }));
  }, []);

  /** Double-clicking a payment field assigns the whole bill to that method. */
  const assignFullAmountTo = useCallback(
    (method) => setPayment(method, formatAmount(invoiceTotal(lines))),
    [lines, setPayment]
  );

  const submitLineForm = useCallback(
    (event) => {
      event?.preventDefault();
      const { name, price, quantity, mrp } = lineForm;
      if (!name || !price || !quantity) return;

      const line = {
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        amount: lineAmount({ price, quantity }),
        ...(parseFloat(mrp) > parseFloat(price) && { mrp: parseFloat(mrp) }),
      };

      setLines((prev) => {
        if (editingLineIndex === null) return [...prev, line];
        return prev.map((existing, index) => (index === editingLineIndex ? line : existing));
      });

      setEditingLineIndex(null);
      setLineForm(EMPTY_LINE_FORM);
    },
    [lineForm, editingLineIndex]
  );

  const startEditingLine = useCallback(
    (index) => {
      const line = lines[index];
      if (!line) return;
      setLineForm({
        name: line.name,
        price: String(line.price),
        quantity: String(line.quantity),
        mrp: line.mrp ? String(line.mrp) : "",
      });
      setEditingLineIndex(index);
    },
    [lines]
  );

  const changeLineQuantity = useCallback((index, delta) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const quantity = Math.max(1, line.quantity + delta);
        return { ...line, quantity, amount: lineAmount({ price: line.price, quantity }) };
      })
    );
  }, []);

  /** Adds a product, or one more of it when its barcode (or name) is already on the bill. */
  const addProduct = useCallback((product, barcode) => {
    const price = Number(product.sellingPrice) || 0;
    setLines((prev) => {
      const index = prev.findIndex((line) =>
        barcode ? String(line.barcode) === String(barcode) : line.name === product.name
      );
      if (index === -1) {
        const line = { name: product.name, quantity: 1, price, amount: price };
        return [{ ...line, ...(barcode && { barcode: String(barcode) }) }, ...prev];
      }
      return prev.map((line, i) => {
        if (i !== index) return line;
        const quantity = line.quantity + 1;
        return { ...line, quantity, amount: lineAmount({ price: line.price, quantity }) };
      });
    });
  }, []);

  /** Spreads an agreed bill total across the lines in proportion, the last line taking the rounding. */
  const settleTotal = useCallback((target) => {
    setLines((prev) => {
      const goal = Number(target);
      const current = invoiceTotal(prev);
      if (!prev.length || !(goal > 0) || !current) return prev;
      const ratio = goal / current;
      const lastIndex = prev.length - 1;
      let allocated = 0;
      return prev.map((line, index) => {
        const mrp = line.mrp ?? line.price;
        const price =
          index === lastIndex
            ? Math.max(0, Math.round(((goal - allocated) / line.quantity) * 100) / 100)
            : Math.round(line.price * ratio * 100) / 100;
        allocated += price * line.quantity;
        const { mrp: _old, ...rest } = line;
        return { ...rest, price, amount: lineAmount({ price, quantity: line.quantity }), ...(mrp > price && { mrp }) };
      });
    });
  }, []);

  const snapshot = useCallback(
    () => ({ customerName, customerNumber, lines, note, payments }),
    [customerName, customerNumber, lines, note, payments]
  );

  const restore = useCallback((bill) => {
    setCustomerName(bill.customerName ?? "");
    setCustomerNumber(bill.customerNumber ?? "");
    setLines(bill.lines ?? []);
    setNote(bill.note ?? "");
    setPayments(bill.payments ?? EMPTY_PAYMENTS);
    setCurrentDate(new Date());
    setLineForm(EMPTY_LINE_FORM);
    setEditingLineIndex(null);
    setEditingInvoice(null);
  }, []);

  const deleteLine = useCallback((index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
    setEditingLineIndex((current) => (current === index ? null : current));
  }, []);

  const reset = useCallback(() => {
    setCustomerName("");
    setCustomerNumber("");
    setLines([]);
    setNote("");
    setPayments(EMPTY_PAYMENTS);
    setCurrentDate(new Date());
    setLineForm(EMPTY_LINE_FORM);
    setEditingLineIndex(null);
    setEditingInvoice(null);
  }, []);

  const loadInvoice = useCallback((invoice) => {
    setEditingInvoice(invoice);
    setCustomerName(invoice.customerName ?? "");
    setCustomerNumber(invoice.customerNumber ?? "");
    setCurrentDate(new Date(invoice.date));
    setLines(parseInvoiceLines(invoice.products));
    setNote(invoice.note ?? "");
    setPayments({
      cash: invoice.cash ?? "",
      upi: invoice.upi ?? "",
      credit: invoice.credit ?? "",
    });
  }, []);

  return {
    customerName,
    setCustomerName,
    customerNumber,
    setCustomerNumber,
    lines,
    setLines,
    note,
    setNote,
    payments,
    setPayment,
    assignFullAmountTo,
    currentDate,
    setCurrentDate,
    lineForm,
    setLineForm,
    editingLineIndex,
    submitLineForm,
    startEditingLine,
    changeLineQuantity,
    addProduct,
    settleTotal,
    snapshot,
    restore,
    deleteLine,
    total,
    itemCount,
    isEditing: editingInvoice !== null,
    editingInvoice,
    loadInvoice,
    reset,
  };
}
