import { env } from "./env";

const titleCase = (text) =>
  text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export const BUSINESS = {
  name: env.businessName,
  displayName: titleCase(env.businessName),
  documentTitle: `${titleCase(env.businessName)} Billing`,
  upiId: env.upiId,
  upiMerchantCode: env.upiMerchantCode,
  upiTransactionRef: env.upiTransactionRef,
  currency: "INR",
  locale: "en-IN",
};

// Indian financial year runs 1 April -> 31 March.
export const FINANCIAL_YEAR_START_MONTH = 3; // April, zero-indexed
export const FINANCIAL_YEAR_OPTION_COUNT = 5;

export const LOW_STOCK_THRESHOLD = 5;
