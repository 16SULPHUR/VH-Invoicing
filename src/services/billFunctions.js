import { supabase } from "@/lib/supabase";
import { isNetworkError } from "@/lib/offline/network";

const MISSING_FUNCTION = "PGRST202";
const BILL_NOT_FOUND = "P0002";

let missing = false;

/**
 * Calls one of the save_bill_function.sql functions, which save a bill and move its
 * stock in one transaction. Returns null when the app should use its older
 * step-by-step writes instead (the SQL has not been run yet, or it failed and
 * rolled back).
 */
export async function callBillFunction(name, args) {
  if (missing) return null;

  const { data, error } = await supabase.rpc(name, args);
  if (!error) return data;
  if (isNetworkError(error) || error.code === BILL_NOT_FOUND) throw error;
  if (error.code === MISSING_FUNCTION) {
    missing = true;
    return null;
  }
  console.error(`${name} failed, falling back to the old save:`, error);
  return null;
}
