import { useCallback, useEffect, useMemo, useState } from "react";
import { invoiceItemCount, invoiceTotal, lineAmount, parseInvoiceLines } from "@/utils/invoice";
import { formatAmount } from "@/utils/formatters";

const EMPTY_LINE_FORM = { name: "", price: "", quantity: "" };
const EMPTY_PAYMENTS = { cash: "", upi: "", credit: "" };

function readSaved(key) {
  if (!key) return null;
  try {
    return JSON.parse(localStorage.getItem(key)) ?? null;
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
  const [currentDate, setCurrentDate] = useState(() =>
    saved?.editingInvoice ? new Date(saved.editingInvoice.date) : new Date()
  );

  const [lineForm, setLineForm] = useState(EMPTY_LINE_FORM);
  const [editingLineIndex, setEditingLineIndex] = useState(null);

  const [editingInvoice, setEditingInvoice] = useState(saved?.editingInvoice ?? null);

  // Survives leaving the billing screen; cleared once the bill is printed or reset.
  useEffect(() => {
    const isEmpty =
      !editingInvoice &&
      lines.length === 0 &&
      !customerName &&
      !customerNumber &&
      !note &&
      !payments.cash &&
      !payments.upi &&
      !payments.credit;
    writeSaved(
      persistKey,
      isEmpty ? null : { customerName, customerNumber, lines, note, payments, editingInvoice }
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
      const { name, price, quantity } = lineForm;
      if (!name || !price || !quantity) return;

      const line = {
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        amount: lineAmount({ price, quantity }),
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
    deleteLine,
    total,
    itemCount,
    isEditing: editingInvoice !== null,
    editingInvoice,
    loadInvoice,
    reset,
  };
}
