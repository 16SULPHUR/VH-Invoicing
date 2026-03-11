import { supabase } from "../supabaseClient";
import { db } from "./offlineDb";

class SyncManager {
  constructor() {
    this._isSyncing = false;
    this._listeners = new Set();
    this._maxRetries = 3;
    this._lastSyncTime = null;
  }

  // --- Subscriber pattern ---

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notify(event) {
    this._listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (e) {
        console.error("SyncManager listener error:", e);
      }
    });
  }

  // --- Queue operations ---

  async addToQueue({ type, table, data, originalDate }) {
    await db.syncQueue.add({
      type,
      table,
      data,
      originalDate,
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0,
      error: null,
    });
    this._notify({ type: "queue_updated" });
  }

  // --- Main sync processor ---

  async processQueue() {
    if (this._isSyncing) return;
    if (!navigator.onLine) return;

    // Verify auth session before syncing
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        this._notify({ type: "auth_required" });
        return;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      this._notify({ type: "auth_required" });
      return;
    }

    this._isSyncing = true;
    this._notify({ type: "sync_started" });

    try {
      const pendingItems = await db.syncQueue
        .where("status")
        .anyOf("pending", "failed")
        .sortBy("timestamp");

      for (const entry of pendingItems) {
        if (!navigator.onLine) break; // Stop if we go offline mid-sync

        try {
          await db.syncQueue.update(entry.id, { status: "syncing" });
          await this._syncEntry(entry);
          await db.syncQueue.delete(entry.id);
          this._notify({ type: "item_synced", entry });
        } catch (err) {
          const newRetryCount = entry.retryCount + 1;
          const newStatus =
            newRetryCount >= this._maxRetries ? "failed" : "pending";

          await db.syncQueue.update(entry.id, {
            status: newStatus,
            retryCount: newRetryCount,
            error: err.message || "Unknown error",
          });

          this._notify({
            type: "item_failed",
            entry,
            error: err.message,
            permanent: newStatus === "failed",
          });
        }
      }

      this._lastSyncTime = Date.now();
      this._notify({ type: "sync_completed", lastSyncTime: this._lastSyncTime });
    } catch (err) {
      console.error("Sync queue processing error:", err);
      this._notify({ type: "sync_error", error: err.message });
    } finally {
      this._isSyncing = false;
    }
  }

  // --- Process a single sync queue entry ---

  async _syncEntry(entry) {
    if (entry.table !== "invoices") {
      throw new Error(`Unsupported table: ${entry.table}`);
    }

    switch (entry.type) {
      case "create":
        return this._syncCreate(entry);
      case "update":
        return this._syncUpdate(entry);
      case "delete":
        return this._syncDelete(entry);
      default:
        throw new Error(`Unsupported operation: ${entry.type}`);
    }
  }

  async _syncCreate(entry) {
    const invoice = entry.data;

    // Get the next available numeric ID from Supabase
    const { data: maxIdData, error: maxIdError } = await supabase
      .from("invoices")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    if (maxIdError) throw maxIdError;

    const nextId = (maxIdData && maxIdData.length > 0) ? maxIdData[0].id + 1 : 1;

    // Build the Supabase-compatible object (strip local-only fields)
    const supabaseInvoice = {
      id: nextId,
      customerName: invoice.customerName,
      customerNumber: invoice.customerNumber,
      products: invoice.products,
      total: invoice.total,
      cash: invoice.cash,
      upi: invoice.upi,
      credit: invoice.credit,
      note: invoice.note,
      date: invoice.date,
    };

    const { data, error } = await supabase
      .from("invoices")
      .insert([supabaseInvoice])
      .select();

    if (error) throw error;

    const serverInvoice = data[0];

    // Update local IndexedDB: replace the offline entry with synced version
    await db.invoices.where("date").equals(invoice.date).modify({
      id: serverInvoice.id,
      _syncStatus: "synced",
      _offlineId: null,
    });

    // Deduct stock for the synced invoice
    await this._updateStock(JSON.parse(invoice.products));
  }

  async _syncUpdate(entry) {
    const updatedData = entry.data;

    // Strip local-only fields
    const supabaseData = { ...updatedData };
    delete supabaseData._syncStatus;
    delete supabaseData._offlineId;

    const { error } = await supabase
      .from("invoices")
      .update(supabaseData)
      .eq("date", entry.originalDate);

    if (error) throw error;

    // Update local cache
    await db.invoices
      .where("date")
      .equals(entry.originalDate)
      .modify({ _syncStatus: "synced" });
  }

  async _syncDelete(entry) {
    const invoice = entry.data;

    // If this was an offline-only invoice (never synced), just clean up locally
    if (
      invoice._offlineId &&
      invoice._syncStatus === "pending"
    ) {
      // It was never on the server, nothing to delete remotely
      await db.invoices.where("date").equals(entry.originalDate).delete();
      return;
    }

    // Restore stock before deleting from server
    try {
      const products = typeof invoice.products === "string"
        ? JSON.parse(invoice.products)
        : invoice.products;
      await this._restoreStock(products);
    } catch (stockErr) {
      console.error("Stock restore failed during sync delete:", stockErr);
      // Continue with delete — stock restore failure shouldn't block deletion
    }

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("date", entry.originalDate);

    if (error) throw error;

    // Remove from local cache
    await db.invoices.where("date").equals(entry.originalDate).delete();
  }

  // --- Stock management (extracted from Dashboard.jsx) ---

  async _updateStock(products) {
    for (const product of products) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("products")
          .select("quantity")
          .ilike("name", product.name)
          .single();

        if (fetchError) {
          console.error(`Stock fetch failed for ${product.name}:`, fetchError);
          continue;
        }

        const newQuantity = existing.quantity - product.quantity;

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .ilike("name", product.name);

        if (updateError) {
          console.error(`Stock update failed for ${product.name}:`, updateError);
        }
      } catch (err) {
        console.error(`Stock update error for ${product.name}:`, err);
      }
    }
  }

  async _restoreStock(products) {
    for (const product of products) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from("products")
          .select("quantity")
          .ilike("name", product.name)
          .single();

        if (fetchError) {
          console.error(`Stock fetch failed for ${product.name}:`, fetchError);
          continue;
        }

        const newQuantity = existing.quantity + product.quantity;

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .ilike("name", product.name);

        if (updateError) {
          console.error(`Stock restore failed for ${product.name}:`, updateError);
        }
      } catch (err) {
        console.error(`Stock restore error for ${product.name}:`, err);
      }
    }
  }

  // --- Connectivity listeners ---

  setupConnectivityListeners() {
    window.addEventListener("online", () => {
      this._notify({ type: "online" });
      // Small delay to let network stabilize
      setTimeout(() => this.processQueue(), 1000);
    });

    window.addEventListener("offline", () => {
      this._notify({ type: "offline" });
    });
  }

  // --- Retry & dismiss ---

  async retryFailed() {
    await db.syncQueue
      .where("status")
      .equals("failed")
      .modify({ status: "pending", retryCount: 0, error: null });
    this._notify({ type: "queue_updated" });
    return this.processQueue();
  }

  async dismissError(queueId) {
    await db.syncQueue.delete(queueId);
    // Also remove the corresponding IndexedDB invoice if it was a create that failed
    this._notify({ type: "queue_updated" });
  }

  // --- State getters ---

  async getSyncState() {
    const pending = await db.syncQueue
      .where("status")
      .equals("pending")
      .count();
    const failed = await db.syncQueue
      .where("status")
      .equals("failed")
      .count();
    return {
      pendingCount: pending,
      failedCount: failed,
      totalCount: pending + failed,
      lastSyncTime: this._lastSyncTime,
      isSyncing: this._isSyncing,
    };
  }
}

export const syncManager = new SyncManager();
