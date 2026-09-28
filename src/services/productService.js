import { supabase, unwrap } from "@/lib/supabase";

const LIST_COLUMNS = "id, name, quantity, sellingPrice, supplier, barcode";

export const productService = {
  async list({ columns = "*" } = {}) {
    return unwrap(await supabase.from("products").select(columns).order("name")) || [];
  },

  async listForCache() {
    return unwrap(await supabase.from("products").select(LIST_COLUMNS)) || [];
  },

  async getByBarcode(barcode) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(product) {
    return unwrap(await supabase.from("products").insert([product]).select());
  },

  async update(id, changes) {
    return unwrap(await supabase.from("products").update(changes).eq("id", id).select());
  },

  async updateMany(ids, changes) {
    return unwrap(await supabase.from("products").update(changes).in("id", ids).select());
  },

  async remove(id) {
    return unwrap(await supabase.from("products").delete().eq("id", id));
  },

  async setImages(id, images) {
    return unwrap(await supabase.from("products").update({ images }).eq("id", id).select());
  },

  /**
   * Applies a stock delta for each line of an invoice. `direction` is -1 when an
   * invoice is created (stock leaves) and +1 when one is deleted (stock returns).
   * One product failing must not abort the rest, so failures are collected and
   * returned rather than thrown.
   */
  async applyStockDelta(lines, direction) {
    const failures = [];

    for (const line of lines ?? []) {
      const quantity = Number(line?.quantity) || 0;
      if (!line?.name || quantity === 0) continue;

      try {
        const { data: existing, error: fetchError } = await supabase
          .from("products")
          .select("id, quantity")
          .ilike("name", line.name)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!existing) {
          failures.push({ name: line.name, reason: "not found in catalog" });
          continue;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity: (Number(existing.quantity) || 0) + direction * quantity })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } catch (error) {
        failures.push({ name: line.name, reason: error.message });
      }
    }

    return failures;
  },

  deductStock(lines) {
    return this.applyStockDelta(lines, -1);
  },

  restoreStock(lines) {
    return this.applyStockDelta(lines, 1);
  },

  /** Editing an invoice only moves the difference between the old and new lines. */
  adjustStockForEdit(previousLines, nextLines) {
    const quantities = new Map();
    const add = (lines, sign) => {
      for (const line of lines ?? []) {
        if (!line?.name) continue;
        const key = line.name.trim().toLowerCase();
        const entry = quantities.get(key) ?? { name: line.name, quantity: 0 };
        entry.quantity += sign * (Number(line.quantity) || 0);
        quantities.set(key, entry);
      }
    };
    add(nextLines, 1);
    add(previousLines, -1);
    return this.deductStock([...quantities.values()]);
  },
};

/**
 * Barcodes are a 3-digit supplier code followed by a 5-digit product sequence.
 * Both counters are derived from the newest existing row.
 */
export const codeGenerator = {
  async nextSupplierCode() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("code")
      .order("code", { ascending: false })
      .limit(1);
    if (error) throw error;

    const last = data?.[0]?.code ?? "000";
    return String(parseInt(last, 10) + 1).padStart(3, "0");
  },

  async nextProductCode() {
    const { data, error } = await supabase
      .from("products")
      .select("barcode")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;

    const lastSequence = String(data?.[0]?.barcode ?? "00000000").slice(-5);
    return String(parseInt(lastSequence, 10) + 1).padStart(5, "0");
  },

  async nextBarcode(supplierCode) {
    return `${supplierCode}${await this.nextProductCode()}`;
  },
};
