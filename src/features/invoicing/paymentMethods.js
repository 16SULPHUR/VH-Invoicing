export const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", icon: "💸" },
  { key: "upi", label: "UPI", icon: "🏛️" },
  { key: "credit", label: "Credit", icon: "❌" },
];

export const PAYMENT_ICONS = Object.fromEntries(
  PAYMENT_METHODS.map(({ key, icon }) => [key, icon])
);

/** The methods an invoice was actually settled with. */
export function usedPaymentMethods(invoice) {
  return PAYMENT_METHODS.filter(({ key }) => Number(invoice[key]) > 0).map(({ key }) => key);
}
