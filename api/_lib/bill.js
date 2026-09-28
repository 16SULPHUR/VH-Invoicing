import { BUSINESS_NAME, SUPABASE_ANON_KEY, SUPABASE_URL } from "./publicEnv.js";

const CODE = /^[A-Za-z0-9]{8,32}$/;

export const SHOP_NAME = BUSINESS_NAME.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function codeFrom(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || url.pathname.match(/^\/b\/([^/?#]+)/)?.[1] || "";
  return CODE.test(code) ? code : null;
}

export async function fetchBill(code) {
  const base = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  if (!code || !base || !key) return null;
  try {
    const response = await fetch(`${base}/rest/v1/rpc/get_public_bill`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_code: code }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export const rupees = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

export function billLines(bill) {
  try {
    const lines = typeof bill.products === "string" ? JSON.parse(bill.products) : bill.products;
    return Array.isArray(lines) ? lines : [];
  } catch {
    return [];
  }
}

export const lineAmount = (line) => (Number(line.price) || 0) * (Number(line.quantity) || 0);

export function billDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

const GENERIC_NAME = /^(walk[\s-]?in|cash|customer|guest|n\/?a|unnamed|-+)$/i;

export function firstName(name) {
  const clean = String(name ?? "").trim().replace(/\s+/g, " ");
  if (!clean || GENERIC_NAME.test(clean)) return "";
  const first = clean.split(" ")[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function shopName(data) {
  return data?.shop?.shop_name || SHOP_NAME;
}
