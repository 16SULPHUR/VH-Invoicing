import { phoneDigits } from "@/features/customers/lib/customerKey";

// No documented limit, but longer click-to-chat links get cut off on some phones.
export const URL_SOFT_LIMIT = 2000;

/** 91 plus the last 10 digits, or null when there is no usable number. */
export function waNumber(phone) {
  const digits = phoneDigits(phone);
  return digits.length === 10 ? `91${digits}` : null;
}

/**
 * Click-to-chat link with the message filled in. Phones always use wa.me; on a
 * computer `opener` can pick WhatsApp Web or the WhatsApp app instead.
 */
export function waUrl(phone, text, opener = "wa.me") {
  const number = waNumber(phone) ?? "";
  const encoded = encodeURIComponent(text);
  if (opener === "web" && !isPhone()) return `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`;
  if (opener === "app" && !isPhone()) return `whatsapp://send?phone=${number}&text=${encoded}`;
  return `https://wa.me/${number}?text=${encoded}`;
}

/** WhatsApp Web reloads each time, so reuse one tab for it. */
export const waTarget = (opener) => (opener === "web" && !isPhone() ? "vh_whatsapp" : "_blank");

export function isPhone() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}
