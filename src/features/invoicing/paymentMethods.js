import { Banknote, CreditCard, Smartphone } from "lucide-react";

/**
 * Payment methods carry their own semantic hue because a cashier has to tell
 * them apart at a glance, mid-transaction, without reading labels.
 */
export const PAYMENT_METHODS = [
  {
    key: "cash",
    label: "Cash",
    icon: Banknote,
    text: "text-cash",
    tint: "bg-cash/10 border-cash/30",
    dot: "bg-cash",
  },
  {
    key: "upi",
    label: "UPI",
    icon: Smartphone,
    text: "text-upi",
    tint: "bg-upi/10 border-upi/30",
    dot: "bg-upi",
  },
  {
    key: "credit",
    label: "Credit",
    icon: CreditCard,
    text: "text-credit",
    tint: "bg-credit/10 border-credit/30",
    dot: "bg-credit",
  },
];

export const PAYMENT_METHOD_BY_KEY = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.key, method])
);

/** The methods an invoice was actually settled with. */
export function usedPaymentMethods(invoice) {
  return PAYMENT_METHODS.filter((method) => Number(invoice[method.key]) > 0);
}
