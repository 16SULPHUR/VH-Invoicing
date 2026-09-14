import { useCallback, useMemo, useState } from "react";
import { invoiceItemCount, invoiceTotal, lineAmount, parseInvoiceLines } from "@/utils/invoice";
import { formatAmount } from "@/utils/formatters";

const EMPTY_LINE_FORM = { name: "", price: "", quantity: "" };
const EMPTY_PAYMENTS = { cash: "", upi: "", credit: "" };

/**
 * Owns the invoice currently being written at the till: its customer, lines,
 * payments and note, plus whether it is a new invoice or an edit of an old one.
 */
export function useInvoiceDraft() {
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState("");
  const [payments, setPayments] = useState(EMPTY_PAYMENTS);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [lineForm, setLineForm] = useState(EMPTY_LINE_FORM);
  const [editingLineIndex, setEditingLineIndex] = useState(null);

  const [editingInvoice, setEditingInvoice] = useState(null);

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
    deleteLine,
    total,
    itemCount,
    isEditing: editingInvoice !== null,
    editingInvoice,
    loadInvoice,
    reset,
  };
}
