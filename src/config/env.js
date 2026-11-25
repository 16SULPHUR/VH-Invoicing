function required(name) {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill it in before starting the app.`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required("VITE_SUPABASE_URL"),
  supabaseAnonKey: required("VITE_SUPABASE_ANON_KEY"),
  businessName: import.meta.env.VITE_BUSINESS_NAME || "VARIETY HEAVEN",
  upiId: import.meta.env.VITE_UPI_ID || "",
  mediaUploadUrl: import.meta.env.VITE_MEDIA_UPLOAD_URL || "",
  upiMerchantCode: import.meta.env.VITE_UPI_MERCHANT_CODE || "",
  upiTransactionRef: import.meta.env.VITE_UPI_TRANSACTION_REF || "",
};
