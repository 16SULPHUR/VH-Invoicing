import { supabase, unwrap } from "@/lib/supabase";

export const customerService = {
  async list() {
    return unwrap(await supabase.from("customers").select().order("name")) || [];
  },

  async create(customer) {
    return unwrap(await supabase.from("customers").insert([customer]).select());
  },

  async update(id, changes) {
    return unwrap(await supabase.from("customers").update(changes).eq("id", id).select());
  },

  async remove(id) {
    return unwrap(await supabase.from("customers").delete().eq("id", id));
  },
};
