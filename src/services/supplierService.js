import { supabase, unwrap } from "@/lib/supabase";

export const supplierService = {
  async list() {
    return unwrap(await supabase.from("suppliers").select("*").order("name")) || [];
  },

  async create(supplier) {
    return unwrap(await supabase.from("suppliers").insert([supplier]).select());
  },

  async update(id, changes) {
    return unwrap(await supabase.from("suppliers").update(changes).eq("id", id).select());
  },

  async remove(id) {
    return unwrap(await supabase.from("suppliers").delete().eq("id", id));
  },
};
