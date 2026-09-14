import { BUSINESS } from "@/config/business";
import { buildUpiLink } from "@/utils/invoice";

export function upiLinkFor(amount) {
  return buildUpiLink({
    upiId: BUSINESS.upiId,
    businessName: BUSINESS.name,
    amount,
    merchantCode: BUSINESS.upiMerchantCode,
    transactionRef: BUSINESS.upiTransactionRef,
  });
}
