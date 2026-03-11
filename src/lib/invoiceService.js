import { supabase } from "../supabaseClient";
import { db } from "./offlineDb";
import { syncManager } from "./syncManager";

function isOnline() {
  return navigator.onLine;
}

function isNetworkError(error) {
  const msg = (error?.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("err_internet_disconnected") ||
    msg.includes("load failed") ||
    error?.code === "NETWORK_ERROR"
  );
}

function generateOfflineId() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substr(2, 4);
  return `OFFLINE-${ts}-${rand}`;
}

export const invoiceService = {
  // --- CREATE ---

  async createInvoice(invoiceData) {
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .insert([invoiceData])
          .select();

        if (error) {
          if (isNetworkError(error)) {
            return this._createOffline(invoiceData);
          }
          throw error;
        }

        const serverInvoice = data[0];

        // Cache locally
        await db.invoices.put({
          ...serverInvoice,
          _syncStatus: "synced",
          _offlineId: null,
        });

        // Update stock
        const products =
          typeof serverInvoice.products === "string"
            ? JSON.parse(serverInvoice.products)
            : serverInvoice.products;
        await syncManager._updateStock(products);

        return { ...serverInvoice, _syncStatus: "synced" };
      } catch (err) {
        if (isNetworkError(err)) {
          return this._createOffline(invoiceData);
        }
        throw err;
      }
    } else {
      return this._createOffline(invoiceData);
    }
  },

  async _createOffline(invoiceData) {
    const offlineId = generateOfflineId();
    const offlineInvoice = {
      ...invoiceData,
      id: offlineId,
      _offlineId: offlineId,
      _syncStatus: "pending",
    };

    await db.invoices.put(offlineInvoice);

    await syncManager.addToQueue({
      type: "create",
      table: "invoices",
      data: offlineInvoice,
      originalDate: invoiceData.date,
    });

    return offlineInvoice;
  },

  // --- READ (financial year) ---

  async getInvoicesByFinancialYear(startDate, endDate) {
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select()
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });

        if (error) {
          if (isNetworkError(error)) {
            return this._getOfflineInvoicesByRange(startDate, endDate);
          }
          throw error;
        }

        // Update local cache with server data
        const serverInvoices = (data || []).map((inv) => ({
          ...inv,
          _syncStatus: "synced",
          _offlineId: null,
        }));

        // Bulk update cache — clear synced entries for this range, keep pending/failed
        const existingSynced = await db.invoices
          .where("_syncStatus")
          .equals("synced")
          .filter(
            (inv) => inv.date >= startDate && inv.date <= endDate
          )
          .toArray();

        // Remove old synced entries in range
        if (existingSynced.length > 0) {
          await db.invoices.bulkDelete(existingSynced.map((inv) => inv.date));
        }

        // Put server data
        if (serverInvoices.length > 0) {
          await db.invoices.bulkPut(serverInvoices);
        }

        // Merge with any local pending/failed invoices in range
        const localPending = await db.invoices
          .where("_syncStatus")
          .anyOf("pending", "failed")
          .filter(
            (inv) => inv.date >= startDate && inv.date <= endDate
          )
          .toArray();

        const merged = [...localPending, ...serverInvoices].sort(
          (a, b) => (a.date < b.date ? 1 : -1)
        );

        return merged;
      } catch (err) {
        if (isNetworkError(err)) {
          return this._getOfflineInvoicesByRange(startDate, endDate);
        }
        throw err;
      }
    } else {
      return this._getOfflineInvoicesByRange(startDate, endDate);
    }
  },

  async _getOfflineInvoicesByRange(startDate, endDate) {
    return await db.invoices
      .filter(
        (inv) => inv.date >= startDate && inv.date <= endDate
      )
      .reverse()
      .sortBy("date");
  },

  // --- READ (single) ---

  async getInvoiceByDate(date) {
    // Always check local cache first for pending/offline invoices
    const local = await db.invoices.get(date);
    if (local && local._syncStatus !== "synced") {
      return local;
    }

    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("date", date)
          .single();

        if (error) {
          if (isNetworkError(error) && local) return local;
          throw error;
        }

        const invoice = { ...data, _syncStatus: "synced", _offlineId: null };
        await db.invoices.put(invoice);
        return invoice;
      } catch (err) {
        if (isNetworkError(err) && local) return local;
        throw err;
      }
    } else {
      if (!local) throw new Error("Invoice not found in offline cache");
      return local;
    }
  },

  // --- READ (all, for ID generation) ---

  async getAllInvoices() {
    if (isOnline()) {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .order("date", { ascending: false });

        if (error) {
          if (isNetworkError(error)) {
            return await db.invoices.reverse().sortBy("date");
          }
          throw error;
        }

        return data || [];
      } catch (err) {
        if (isNetworkError(err)) {
          return await db.invoices.reverse().sortBy("date");
        }
        throw err;
      }
    } else {
      return await db.invoices.reverse().sortBy("date");
    }
  },

  // --- Get next invoice ID ---

  getNextInvoiceId(invoices) {
    // Filter out offline IDs and find the maximum numeric ID
    const numericIds = invoices
      .map((inv) => inv.id)
      .filter((id) => typeof id === "number" || /^\d+$/.test(id))
      .map((id) => (typeof id === "number" ? id : parseInt(id, 10)));

    if (numericIds.length === 0) return 1;
    return Math.max(...numericIds) + 1;
  },

  // --- UPDATE ---

  async updateInvoice(date, updatedData) {
    if (isOnline()) {
      try {
        // Strip local-only fields before sending to Supabase
        const supabaseData = { ...updatedData };
        delete supabaseData._syncStatus;
        delete supabaseData._offlineId;

        const { data, error } = await supabase
          .from("invoices")
          .update(supabaseData)
          .eq("date", date);

        if (error) {
          if (isNetworkError(error)) {
            return this._updateOffline(date, updatedData);
          }
          throw error;
        }

        // Update local cache
        await db.invoices.put({
          ...updatedData,
          date,
          _syncStatus: "synced",
          _offlineId: null,
        });

        // Update stock
        const products =
          typeof updatedData.products === "string"
            ? JSON.parse(updatedData.products)
            : updatedData.products;
        await syncManager._updateStock(products);

        return data;
      } catch (err) {
        if (isNetworkError(err)) {
          return this._updateOffline(date, updatedData);
        }
        throw err;
      }
    } else {
      return this._updateOffline(date, updatedData);
    }
  },

  async _updateOffline(date, updatedData) {
    await db.invoices.put({
      ...updatedData,
      date,
      _syncStatus: "pending",
    });

    await syncManager.addToQueue({
      type: "update",
      table: "invoices",
      data: updatedData,
      originalDate: date,
    });

    return updatedData;
  },

  // --- DELETE ---

  async deleteInvoice(date) {
    if (isOnline()) {
      try {
        // Fetch invoice to restore stock
        const invoice = await this.getInvoiceByDate(date);
        const products =
          typeof invoice.products === "string"
            ? JSON.parse(invoice.products)
            : invoice.products;

        // Restore stock
        await syncManager._restoreStock(products);

        // Delete from Supabase
        const { error } = await supabase
          .from("invoices")
          .delete()
          .eq("date", date);

        if (error) {
          if (isNetworkError(error)) {
            return this._deleteOffline(date);
          }
          throw error;
        }

        // Remove from local cache
        await db.invoices.delete(date);
      } catch (err) {
        if (isNetworkError(err)) {
          return this._deleteOffline(date);
        }
        throw err;
      }
    } else {
      return this._deleteOffline(date);
    }
  },

  async _deleteOffline(date) {
    const invoice = await db.invoices.get(date);
    if (!invoice) throw new Error("Invoice not found in offline cache");

    // If it's a pending offline invoice (never synced), just remove it locally
    // and remove the create entry from the sync queue
    if (invoice._offlineId && invoice._syncStatus === "pending") {
      await db.invoices.delete(date);
      const queueEntries = await db.syncQueue
        .where("originalDate")
        .equals(date)
        .toArray();
      for (const entry of queueEntries) {
        await db.syncQueue.delete(entry.id);
      }
      return;
    }

    // For synced invoices deleted while offline, queue the delete
    await db.invoices.delete(date);

    await syncManager.addToQueue({
      type: "delete",
      table: "invoices",
      data: invoice,
      originalDate: date,
    });
  },
};
