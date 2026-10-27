import { supabase } from "@/lib/supabase";
import { db, SYNC_STATUS } from "@/lib/offline/db";
import { syncManager } from "@/lib/offline/syncManager";
import {
  generateOfflineId,
  isNetworkError,
  isOnline,
  withOfflineFallback,
} from "@/lib/offline/network";
import { productService } from "./productService";
import { callBillFunction } from "./billFunctions";

const TABLE = "invoices";

function parseLines(products) {
  if (!products) return [];
  return typeof products === "string" ? JSON.parse(products) : products;
}

function asSynced(invoice) {
  return { ...invoice, _syncStatus: SYNC_STATUS.SYNCED, _offlineId: null };
}

function isQueuedLocally(invoice) {
  return Boolean(invoice) && invoice._syncStatus !== SYNC_STATUS.SYNCED;
}

function isUnsyncedCreate(invoice) {
  return Boolean(invoice?._offlineId) && invoice._syncStatus !== SYNC_STATUS.SYNCED;
}

function stripLocalFields(invoice) {
  const payload = { ...invoice };
  delete payload._syncStatus;
  delete payload._offlineId;
  return payload;
}

export const invoiceService = {
  createInvoice(invoice) {
    return withOfflineFallback(
      async () => {
        const result = await callBillFunction("create_bill", { p_bill: invoice });
        if (result) {
          const saved = asSynced(result.invoice);
          await db.invoices.put(saved);
          return { ...saved, stockFailures: result.stock_failures };
        }

        const { data, error } = await supabase.from(TABLE).insert([invoice]).select();
        if (error) throw error;

        const saved = asSynced(data[0]);
        await db.invoices.put(saved);
        const stockFailures = await productService.deductStock(parseLines(saved.products));
        return { ...saved, stockFailures };
      },
      () => this._createOffline(invoice)
    );
  },

  async _createOffline(invoice) {
    const offlineId = generateOfflineId();
    const offlineInvoice = {
      ...invoice,
      id: offlineId,
      _offlineId: offlineId,
      _printedId: invoice.id,
      _syncStatus: SYNC_STATUS.PENDING,
    };

    await db.invoices.put(offlineInvoice);
    await syncManager.addToQueue({
      type: "create",
      table: TABLE,
      data: offlineInvoice,
      originalDate: invoice.date,
    });

    return offlineInvoice;
  },

  getInvoicesByFinancialYear(startDate, endDate) {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from(TABLE)
          .select()
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });
        if (error) throw error;

        const localPending = await db.invoices
          .where("_syncStatus")
          .anyOf(SYNC_STATUS.PENDING, SYNC_STATUS.FAILED)
          .filter((inv) => inv.date >= startDate && inv.date <= endDate)
          .toArray();
        const pendingDates = new Set(localPending.map((inv) => inv.date));

        const serverInvoices = (data || [])
          .filter((inv) => !pendingDates.has(inv.date))
          .map(asSynced);
        await this._replaceSyncedRange(startDate, endDate, serverInvoices);

        return [...localPending, ...serverInvoices].sort((a, b) => (a.date < b.date ? 1 : -1));
      },
      () => this._getOfflineRange(startDate, endDate)
    );
  },

  /** Server data wins for synced rows; locally queued rows are never dropped. */
  async _replaceSyncedRange(startDate, endDate, serverInvoices) {
    const staleSynced = await db.invoices
      .where("_syncStatus")
      .equals(SYNC_STATUS.SYNCED)
      .filter((inv) => inv.date >= startDate && inv.date <= endDate)
      .toArray();

    if (staleSynced.length > 0) {
      await db.invoices.bulkDelete(staleSynced.map((inv) => inv.date));
    }
    if (serverInvoices.length > 0) {
      await db.invoices.bulkPut(serverInvoices);
    }
  },

  _getOfflineRange(startDate, endDate) {
    return db.invoices
      .filter((inv) => inv.date >= startDate && inv.date <= endDate)
      .reverse()
      .sortBy("date");
  },

  async getInvoiceByDate(date) {
    const local = await db.invoices.get(date);

    // A locally queued edit is newer than whatever the server still holds.
    if (local && local._syncStatus !== SYNC_STATUS.SYNCED) return local;

    if (!isOnline()) {
      if (!local) throw new Error("Invoice not found in offline cache");
      return local;
    }

    try {
      const { data, error } = await supabase.from(TABLE).select("*").eq("date", date).single();
      if (error) throw error;

      const invoice = asSynced(data);
      await db.invoices.put(invoice);
      return invoice;
    } catch (error) {
      if (isNetworkError(error) && local) return local;
      throw error;
    }
  },

  getAllInvoices() {
    return withOfflineFallback(
      async () => {
        const { data, error } = await supabase
          .from(TABLE)
          .select("*")
          .order("date", { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => db.invoices.reverse().sortBy("date")
    );
  },

  /** Offline bills carry a temporary id, but the number printed on them is still taken. */
  getNextInvoiceId(invoices) {
    const numericIds = (invoices || [])
      .map((invoice) => (isUnsyncedCreate(invoice) ? invoice._printedId : invoice.id))
      .filter((id) => typeof id === "number" || /^\d+$/.test(String(id)))
      .map(Number);

    return numericIds.length === 0 ? 1 : Math.max(...numericIds) + 1;
  },

  async updateInvoice(date, changes) {
    const local = await db.invoices.get(date);
    // Anything already queued for this invoice must sync first, so queue behind it.
    if (isQueuedLocally(local)) return this._updateOffline(date, changes);

    return withOfflineFallback(
      async () => {
        const result = await callBillFunction("update_bill", {
          p_date: date,
          p_changes: stripLocalFields(changes),
        });
        if (result) {
          const saved = asSynced({ ...result.invoice, date });
          await db.invoices.put(saved);
          return { ...saved, stockFailures: result.stock_failures };
        }

        const previous = await this.getInvoiceByDate(date);

        const { error } = await supabase
          .from(TABLE)
          .update(stripLocalFields(changes))
          .eq("date", date);
        if (error) throw error;

        const saved = asSynced({ ...previous, ...changes, date });
        await db.invoices.put(saved);
        const stockFailures = await productService.adjustStockForEdit(
          parseLines(previous.products),
          parseLines(changes.products)
        );
        return { ...saved, stockFailures };
      },
      () => this._updateOffline(date, changes)
    );
  },

  async _updateOffline(date, changes) {
    const local = await db.invoices.get(date);
    const updated = { ...local, ...changes, date, _syncStatus: SYNC_STATUS.PENDING };
    await db.invoices.put(updated);

    // Fold edits of a never-synced invoice into its queued create.
    if (isUnsyncedCreate(local)) {
      const queuedCreate = await db.syncQueue
        .filter((entry) => entry.type === "create" && entry.originalDate === date)
        .first();
      if (queuedCreate) {
        await db.syncQueue.update(queuedCreate.id, { data: updated });
        return updated;
      }
    }

    await syncManager.addToQueue({
      type: "update",
      table: TABLE,
      data: changes,
      originalDate: date,
      previousProducts: local?.products ?? null,
    });
    return updated;
  },

  async deleteInvoice(date) {
    const local = await db.invoices.get(date);
    if (isQueuedLocally(local)) return this._deleteOffline(date);

    return withOfflineFallback(
      async () => {
        const result = await callBillFunction("delete_bill", { p_date: date });
        if (result) {
          await db.invoices.delete(date);
          return { stockFailures: result.stock_failures };
        }

        const invoice = await this.getInvoiceByDate(date);

        const { error } = await supabase.from(TABLE).delete().eq("date", date);
        if (error) throw error;

        await db.invoices.delete(date);
        const stockFailures = await productService.restoreStock(parseLines(invoice.products));
        return { stockFailures };
      },
      () => this._deleteOffline(date)
    );
  },

  async _deleteOffline(date) {
    const invoice = await db.invoices.get(date);
    if (!invoice) throw new Error("Invoice not found in offline cache");

    await db.invoices.delete(date);

    // An invoice that never synced can just be dropped along with its queued writes.
    if (isUnsyncedCreate(invoice)) {
      const queued = await db.syncQueue.filter((entry) => entry.originalDate === date).toArray();
      await db.syncQueue.bulkDelete(queued.map((entry) => entry.id));
      return;
    }

    await syncManager.addToQueue({
      type: "delete",
      table: TABLE,
      data: invoice,
      originalDate: date,
    });
  },

  /** Totals for the sales summary panel, computed server-side where possible. */
  async getSalesSummary(startDate, endDate) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("date, total, cash, upi, credit")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });
    if (error) throw error;

    const sum = (rows, key) => rows.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0);
    const rows = data || [];

    return {
      total: sum(rows, "total"),
      cash: sum(rows, "cash"),
      upi: sum(rows, "upi"),
      credit: sum(rows, "credit"),
      count: rows.length,
    };
  },

  async getDailySales(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from(TABLE)
      .select("date, total")
      .gte("date", since.toISOString().split("T")[0])
      .order("date", { ascending: false });
    if (error) throw error;

    const totalsByDate = (data || []).reduce((acc, invoice) => {
      const day = new Date(invoice.date).toISOString().split("T")[0];
      acc[day] = (acc[day] || 0) + parseFloat(invoice.total);
      return acc;
    }, {});

    return Object.entries(totalsByDate)
      .map(([date, total]) => ({
        date,
        total,
        formattedDate: String(new Date(date).getDate()).padStart(2, "0"),
      }))
      .reverse();
  },

  async getCreditInvoices() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .gt("credit", 0)
      .order("date", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updatePaymentStatus(id, paymentStatus) {
    const { error } = await supabase.from(TABLE).update({ paymentStatus }).eq("id", id);
    if (error) throw error;
  },
};
