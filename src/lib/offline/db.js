import Dexie from "dexie";

export const db = new Dexie("VHInvoicing");

db.version(1).stores({
  // Invoices are keyed by their ISO date string, matching the Supabase access pattern.
  invoices: "date, id, customerName, _syncStatus, _offlineId",
  products: "id, name, barcode, supplier",
  customers: "id, name, phone",
  syncQueue: "++id, type, table, status, timestamp",
});

export const SYNC_STATUS = {
  SYNCED: "synced",
  PENDING: "pending",
  FAILED: "failed",
  SYNCING: "syncing",
};
