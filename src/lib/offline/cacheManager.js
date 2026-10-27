import { db } from "./db";
import { isOnline } from "./network";
import { productService } from "@/services/productService";
import { customerService } from "@/services/customerService";

async function replaceTable(table, rows) {
  if (!rows?.length) return;
  await db.transaction("rw", table, async () => {
    await table.clear();
    await table.bulkPut(rows);
  });
}

export const cacheManager = {
  async refreshProducts() {
    if (!isOnline()) return;
    try {
      await replaceTable(db.products, await productService.listForCache());
    } catch (error) {
      console.error("Failed to refresh products cache:", error);
    }
  },

  async refreshCustomers() {
    if (!isOnline()) return;
    try {
      await replaceTable(db.customers, await customerService.list());
    } catch (error) {
      console.error("Failed to refresh customers cache:", error);
    }
  },

  getCachedProducts() {
    return db.products.toArray();
  },

  getCachedCustomers() {
    return db.customers.toArray();
  },

  async refreshAll() {
    await Promise.all([this.refreshProducts(), this.refreshCustomers()]);
  },
};
