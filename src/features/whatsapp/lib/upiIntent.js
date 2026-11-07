/** upi:// intent with the amount filled in. Spaces as %20: some UPI apps show "+" literally. */
export function upiIntent({ upiId, payee, amount, note }) {
  const params = { pa: upiId, pn: payee, am: Number(amount).toFixed(2), cu: "INR", tn: note };
  return `upi://pay?${Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%40/g, "@")}`)
    .join("&")}`;
}
