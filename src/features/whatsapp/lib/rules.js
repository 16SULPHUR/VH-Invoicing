export const DEFAULT_RULES = {
  language: "hi",
  duesGapDays: 7,
  firmAfterDays: 30,
  finalAfterDays: 60,
  offersPerMonth: 4,
  payLinkDays: 30,
  contactPrefix: "VH · ",
  opener: "wa.me",
  appUrl: "",
};

export const RULE_FIELDS = [
  { key: "duesGapDays", label: "Days between dues reminders", min: 1, max: 60 },
  { key: "firmAfterDays", label: "Firm reminder from (days)", min: 1, max: 365 },
  { key: "finalAfterDays", label: "Final reminder after (days)", min: 2, max: 730 },
  { key: "offersPerMonth", label: "Offers per customer a month", min: 1, max: 30 },
  { key: "payLinkDays", label: "Pay link works for (days)", min: 8, max: 180 },
];

export function mergeRules(saved) {
  const rules = { ...DEFAULT_RULES, ...(saved && typeof saved === "object" ? saved : {}) };
  for (const { key, min, max } of RULE_FIELDS) {
    const value = Math.round(Number(rules[key]));
    rules[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : DEFAULT_RULES[key];
  }
  return rules;
}

export function appOrigin(rules) {
  const url = String(rules.appUrl ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(url) ? url : window.location.origin;
}
