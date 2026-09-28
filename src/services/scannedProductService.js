import { supabase, unwrap } from "@/lib/supabase";

// The `scanned_products` table is a shared scratchpad: the phone scanner writes
// rows, the till subscribes and turns them into invoice lines.
export const scannedProductService = {
  async list() {
    return (
      unwrap(
        await supabase
          .from("scanned_products")
          .select("*")
          .order("created_at", { ascending: false })
      ) || []
    );
  },

  async add({ barcode, quantity = 1, price = 0 }) {
    return unwrap(
      await supabase.from("scanned_products").insert([{ name: barcode, quantity, price }])
    );
  },

  async removeByBarcode(barcode) {
    return unwrap(await supabase.from("scanned_products").delete().eq("name", barcode));
  },

  async clear() {
    return unwrap(await supabase.from("scanned_products").delete().neq("id", 0));
  },

  subscribe(onChange) {
    const channel = supabase
      .channel(`scanned-products-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "scanned_products" }, onChange)
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

export const printCommandService = {
  async requestPrint({ customerName, customerPhone }) {
    const result = await supabase
      .from("print_command")
      .insert([{ customer_name: customerName, customer_phone: customerPhone }]);
    // Until print_command_phone.sql is run the column is missing; print without it.
    if (result.error?.code === "PGRST204") {
      return unwrap(await supabase.from("print_command").insert([{ customer_name: customerName }]));
    }
    return unwrap(result);
  },

  subscribe(onChange) {
    const channel = supabase
      .channel("print-command-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_command" }, onChange)
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
