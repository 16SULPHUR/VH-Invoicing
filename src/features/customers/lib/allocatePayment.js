/** Splits a payment across the chosen bills, oldest first. */
export function allocatePayment(invoices, amount, selectedDates) {
  let remaining = Math.round(Number(amount) || 0);
  const oldestFirst = [...invoices].sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return oldestFirst.map((invoice) => {
    const due = Math.round(Number(invoice.credit) || 0);
    const applied = selectedDates.has(invoice.date) ? Math.min(due, Math.max(remaining, 0)) : 0;
    remaining -= applied;
    return { invoice, amount: applied, due, left: due - applied };
  });
}
