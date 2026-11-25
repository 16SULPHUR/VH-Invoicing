import { supabase } from "@/lib/supabase";

export const authService = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data?.session ?? null;
  },

  async hasValidSession() {
    try {
      const session = await this.getSession();
      return Boolean(session && session.expires_at > Date.now() / 1000);
    } catch {
      return false;
    }
  },

  signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return () => data.subscription.unsubscribe();
  },
};
