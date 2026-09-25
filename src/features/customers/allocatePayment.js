/** Splits a payment across the chosen bills, oldest first. */
export function allocatePayment(invoices, amount, selectedDates) {
  let remaining = Number(amount) || 0;
  const oldestFirst = [...invoices].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return oldestFirst.map((invoice) => {
    const due = Number(invoice.credit) || 0;
    const applied = selectedDates.has(invoice.date) ? Math.min(due, Math.max(remaining, 0)) : 0;
    remaining -= applied;
    return { invoice, amount: Math.round(applied * 100) / 100, due, left: Math.round((due - applied) * 100) / 100 };
  });
}
