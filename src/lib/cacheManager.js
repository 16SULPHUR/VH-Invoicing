import { supabase } from "../supabaseClient";
import { db } from "./offlineDb";

export const cacheManager = {
  async refreshProducts() {
    if (!navigator.onLine) return;
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, quantity, sellingPrice, supplier, barcode");
      if (error) {
        console.error("Error refreshing products cache:", error);
        return;
      }
      await db.products.clear();
      await db.products.bulkPut(data);
    } catch (err) {
      console.error("Failed to refresh products cache:", err);
    }
  },

  async refreshCustomers() {
    if (!navigator.onLine) return;
    try {
      const { data, error } = await supabase.from("customers").select();
      if (error) {
        console.error("Error refreshing customers cache:", error);
        return;
      }
      await db.customers.clear();
      await db.customers.bulkPut(data);
    } catch (err) {
      console.error("Failed to refresh customers cache:", err);
    }
  },

  async getCachedProducts() {
    return await db.products.toArray();
  },

  async getCachedCustomers() {
    return await db.customers.toArray();
  },

  async refreshAll() {
    await Promise.all([this.refreshProducts(), this.refreshCustomers()]);
  },
};
