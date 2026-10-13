export const ENTRY_KINDS = [
  { value: "expense", label: "Expense paid", needsSource: true, build: (source) => ({ debit: "Expenses", credit: source }) },
  { value: "owner_in", label: "Money put in by owner", needsSource: true, build: (source) => ({ debit: source, credit: "Capital" }) },
  { value: "owner_out", label: "Money taken by owner", needsSource: true, build: (source) => ({ debit: "Capital", credit: source }) },
  { value: "deposit", label: "Cash deposited in bank", build: () => ({ debit: "Bank", credit: "Cash" }) },
  { value: "withdraw", label: "Cash withdrawn from bank", build: () => ({ debit: "Cash", credit: "Bank" }) },
];

export function entryLines(kind, source, amount) {
  const { debit, credit } = ENTRY_KINDS.find((item) => item.value === kind).build(source);
  return [
    { account: debit, amount },
    { account: credit, amount: -amount },
  ];
}

export const SOURCE_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
];

export const REFERENCE_LABELS = {
  invoices: "Sale",
  credit_payments: "Customer payment",
  supplier_bills: "Purchase",
  supplier_payments: "Supplier payment",
  journal: "Manual entry",
};

export const referenceLabel = (table) => REFERENCE_LABELS[table] ?? "Entry";
