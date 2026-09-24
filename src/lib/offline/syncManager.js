import { supabase } from "@/lib/supabase";
import { productService } from "@/services/productService";
import { currentFinancialYear, financialYearRange } from "@/utils/date";
import { db, SYNC_STATUS } from "./db";

const MAX_RETRIES = 3;
const RECONNECT_SETTLE_MS = 1000;

function parseLines(products) {
  if (!products) return [];
  return typeof products === "string" ? JSON.parse(products) : products;
}

/**
 * Drains the offline write queue into Supabase. Handlers are registered per
 * table so a new offline-capable table only needs an entry in `_handlers`.
 */
class SyncManager {
  constructor() {
    this._isSyncing = false;
    this._listeners = new Set();
    this._lastSyncTime = null;
    this._teardown = null;
    this._handlers = {
      invoices: {
        create: (entry) => this._createInvoice(entry),
        update: (entry) => this._updateInvoice(entry),
        delete: (entry) => this._deleteInvoice(entry),
      },
    };
  }

  registerHandler(table, handlers) {
    this._handlers[table] = { ...this._handlers[table], ...handlers };
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify(event) {
    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error("SyncManager listener error:", error);
      }
    }
  }

  async addToQueue({ type, table, data, originalDate, previousProducts = null }) {
    await db.syncQueue.add({
      type,
      table,
      data,
      originalDate,
      previousProducts,
      timestamp: Date.now(),
      status: SYNC_STATUS.PENDING,
      retryCount: 0,
      error: null,
    });
    this._notify({ type: "queue_updated" });
  }

  async processQueue() {
    if (this._isSyncing || !navigator.onLine) return;

    if (!(await this._hasSession())) {
      this._notify({ type: "auth_required" });
      return;
    }

    this._isSyncing = true;
    this._notify({ type: "sync_started" });

    try {
      const pending = await db.syncQueue
        .where("status")
        .anyOf(SYNC_STATUS.PENDING, SYNC_STATUS.FAILED)
        .sortBy("timestamp");

      for (const entry of pending) {
        if (!navigator.onLine) break;
        await this._processEntry(entry);
      }

      this._lastSyncTime = Date.now();
      this._notify({ type: "sync_completed", lastSyncTime: this._lastSyncTime });
    } catch (error) {
      console.error("Sync queue processing error:", error);
      this._notify({ type: "sync_error", error: error.message });
    } finally {
      this._isSyncing = false;
    }
  }

  async _hasSession() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return Boolean(session);
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }

  async _processEntry(entry) {
    try {
      await db.syncQueue.update(entry.id, { status: SYNC_STATUS.SYNCING });
      await this._runHandler(entry);
      await db.syncQueue.delete(entry.id);
      this._notify({ type: "item_synced", entry });
    } catch (error) {
      const retryCount = entry.retryCount + 1;
      const status = retryCount >= MAX_RETRIES ? SYNC_STATUS.FAILED : SYNC_STATUS.PENDING;

      await db.syncQueue.update(entry.id, {
        status,
        retryCount,
        error: error.message || "Unknown error",
      });

      this._notify({
        type: "item_failed",
        entry,
        error: error.message,
        permanent: status === SYNC_STATUS.FAILED,
      });
    }
  }

  _runHandler(entry) {
    const handler = this._handlers[entry.table]?.[entry.type];
    if (!handler) {
      throw new Error(`No sync handler for ${entry.table}.${entry.type}`);
    }
    return handler(entry);
  }

  async _createInvoice(entry) {
    const invoice = entry.data;

    // Invoice numbers restart every financial year, so only look within the invoice's own year.
    const { startDate, endDate } = financialYearRange(currentFinancialYear(new Date(invoice.date)));
    const { data: maxRow, error: maxError } = await supabase
      .from("invoices")
      .select("id")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("id", { ascending: false })
      .limit(1);
    if (maxError) throw maxError;

    const nextId = maxRow?.length ? maxRow[0].id + 1 : 1;

    const { data, error } = await supabase
      .from("invoices")
      .insert([
        {
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
        },
      ])
      .select();
    if (error) throw error;

    await db.invoices.where("date").equals(invoice.date).modify({
      id: data[0].id,
      _syncStatus: SYNC_STATUS.SYNCED,
      _offlineId: null,
    });

    await productService.deductStock(parseLines(invoice.products));
  }

  async _updateInvoice(entry) {
    const payload = { ...entry.data };
    delete payload._syncStatus;
    delete payload._offlineId;

    const { error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("date", entry.originalDate);
    if (error) throw error;

    if (entry.previousProducts && payload.products) {
      await productService.adjustStockForEdit(
        parseLines(entry.previousProducts),
        parseLines(payload.products)
      );
    }

    await db.invoices
      .where("date")
      .equals(entry.originalDate)
      .modify({ _syncStatus: SYNC_STATUS.SYNCED });
  }

  async _deleteInvoice(entry) {
    const invoice = entry.data;

    // Never reached the server, so there is nothing to delete remotely.
    if (invoice._offlineId && invoice._syncStatus !== SYNC_STATUS.SYNCED) {
      await db.invoices.where("date").equals(entry.originalDate).delete();
      return;
    }

    try {
      await productService.restoreStock(parseLines(invoice.products));
    } catch (error) {
      // A stock restore failure must not strand the delete in the queue forever.
      console.error("Stock restore failed during sync delete:", error);
    }

    const { error } = await supabase.from("invoices").delete().eq("date", entry.originalDate);
    if (error) throw error;

    await db.invoices.where("date").equals(entry.originalDate).delete();
  }

  setupConnectivityListeners() {
    if (this._teardown) return this._teardown;

    const handleOnline = () => {
      this._notify({ type: "online" });
      setTimeout(() => this.processQueue(), RECONNECT_SETTLE_MS);
    };
    const handleOffline = () => this._notify({ type: "offline" });

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Drain anything left in the queue from a previous session.
    const startupSync = setTimeout(() => this.processQueue(), RECONNECT_SETTLE_MS);

    this._teardown = () => {
      clearTimeout(startupSync);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      this._teardown = null;
    };
    return this._teardown;
  }

  async retryFailed() {
    await db.syncQueue
      .where("status")
      .equals(SYNC_STATUS.FAILED)
      .modify({ status: SYNC_STATUS.PENDING, retryCount: 0, error: null });
    this._notify({ type: "queue_updated" });
    return this.processQueue();
  }

  async dismissError(queueId) {
    await db.syncQueue.delete(queueId);
    this._notify({ type: "queue_updated" });
  }

  async listFailed() {
    return db.syncQueue.where("status").equals(SYNC_STATUS.FAILED).toArray();
  }

  async getSyncState() {
    const [pendingCount, failedCount] = await Promise.all([
      db.syncQueue.where("status").equals(SYNC_STATUS.PENDING).count(),
      db.syncQueue.where("status").equals(SYNC_STATUS.FAILED).count(),
    ]);

    return {
      pendingCount,
      failedCount,
      totalCount: pendingCount + failedCount,
      lastSyncTime: this._lastSyncTime,
      isSyncing: this._isSyncing,
    };
  }
}

export const syncManager = new SyncManager();
