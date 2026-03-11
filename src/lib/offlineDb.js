import Dexie from "dexie";

export const db = new Dexie("VHInvoicing");

db.version(1).stores({
  // Primary key: date (ISO string) — matches existing Supabase query pattern
  // Indexed fields for querying
  invoices: "date, id, customerName, _syncStatus, _offlineId",

  // Products cache for offline form usage
  products: "id, name, barcode, supplier",

  // Customers cache for offline form usage
  customers: "id, name, phone",

  // Sync queue — auto-increment primary key
  // Ordered by timestamp for chronological processing
  syncQueue: "++id, type, table, status, timestamp",
});
