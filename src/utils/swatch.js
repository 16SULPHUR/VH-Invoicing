// Fabric-style colour for a product, taken from a colour word in its name when
// there is one, otherwise picked consistently from the block-print palette.
const NAMED = [
  [/\b(navy|indigo)\b/, "#2b2f7a"],
  [/\b(blue|sky)\b/, "#2f5fb3"],
  [/\b(red|maroon|wine)\b/, "#c8243b"],
  [/\b(black)\b/, "#26222e"],
  [/\b(white|cream|off.?white|ivory)\b/, "#d9d2c3"],
  [/\b(grey|gray|silver)\b/, "#7d7890"],
  [/\b(green|olive|mehndi)\b/, "#1f8a5b"],
  [/\b(teal|peacock|rama)\b/, "#16808a"],
  [/\b(yellow|gold|golden|mustard)\b/, "#e0a21b"],
  [/\b(orange|rust)\b/, "#e0662b"],
  [/\b(pink|rani|magenta)\b/, "#d6246e"],
  [/\b(purple|violet|wine|lavender)\b/, "#6b2f7f"],
  [/\b(brown|beige|chiku)\b/, "#8a5a3b"],
];

const PALETTE = ["#d6246e", "#2f5fb3", "#1f8a5b", "#f5a524", "#6b2f7f", "#16808a", "#c8243b", "#33276a"];

export function swatchFor(name = "") {
  const lower = String(name).toLowerCase();
  const named = NAMED.find(([pattern]) => pattern.test(lower));
  if (named) return named[1];
  let hash = 0;
  for (const char of lower) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function initialsFor(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}
