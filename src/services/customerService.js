import { supabase, unwrap } from "@/lib/supabase";
import { isMissingColumn } from "@/lib/supabaseErrors";
import { customerKey, phoneDigits } from "@/features/customers/lib/customerKey";

// WhatsApp consent and greeting dates, added by docs/schema/whatsapp_outbox.sql.
export const WA_FIELDS = ["wa_optin", "wa_optin_at", "wa_optout_at", "birthday", "anniversary"];
const LOCAL_CONSENT = "vh.waConsent";

const pick = (object, keys) => Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]));
const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
const hasWaFields = (changes) => WA_FIELDS.some((key) => key in changes);

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CONSENT)) ?? {};
  } catch {
    return {};
  }
}

function writeConsent(all) {
  try {
    localStorage.setItem(LOCAL_CONSENT, JSON.stringify(all));
  } catch {
    // Storage full or blocked.
  }
}

/** Keeps consent in this browser, by customer key, until the columns exist. */
function keepLocally(customer, changes) {
  const all = readConsent();
  const key = customerKey(customer);
  all[key] = { ...all[key], name: customer.name, phone: customer.phone, ...pick(changes, WA_FIELDS) };
  writeConsent(all);
}

const toPhone = (phone) => {
  const digits = phoneDigits(phone);
  return digits.length === 10 ? Number(digits) : null;
};

/** Moves consent saved in this browser into the customers table once it can hold it. */
async function syncLocalConsent(rows) {
  const local = readConsent();
  const keys = Object.keys(local);
  if (keys.length === 0) return false;
  const byKey = new Map(rows.map((row) => [customerKey(row), row]));
  for (const key of keys) {
    const { name, phone, ...fields } = local[key];
    const row = byKey.get(key);
    const values = pick(fields, WA_FIELDS);
    if (row) unwrap(await supabase.from("customers").update(values).eq("id", row.id));
    else unwrap(await supabase.from("customers").insert([{ name, phone: toPhone(phone), ...values }]));
  }
  writeConsent({});
  return true;
}

export const customerService = {
  async list(synced = false) {
    const rows = unwrap(await supabase.from("customers").select().order("name")) || [];
    const columnsReady = rows.length > 0 && "wa_optin" in rows[0];
    if (columnsReady && !synced && (await syncLocalConsent(rows).catch(() => false))) return this.list(true);
    if (columnsReady) return rows;
    const local = readConsent();
    return rows.map((row) => ({ ...pick(local[customerKey(row)] ?? {}, WA_FIELDS), ...row }));
  },

  /** Consent saved in this browser for customers without a row, keyed by customer key. */
  localConsent: readConsent,

  async create(customer) {
    try {
      return unwrap(await supabase.from("customers").insert([customer]).select());
    } catch (error) {
      if (!isMissingColumn(error) || !hasWaFields(customer)) throw error;
      keepLocally(customer, customer);
      return unwrap(await supabase.from("customers").insert([omit(customer, WA_FIELDS)]).select());
    }
  },

  async update(id, changes) {
    try {
      return unwrap(await supabase.from("customers").update(changes).eq("id", id).select());
    } catch (error) {
      if (!isMissingColumn(error) || !hasWaFields(changes)) throw error;
      keepLocally(changes, changes);
      const rest = omit(changes, WA_FIELDS);
      if (Object.keys(rest).length === 0) return [];
      return unwrap(await supabase.from("customers").update(rest).eq("id", id).select());
    }
  },

  /**
   * Says yes or no to offers on WhatsApp. A customer known only from bills gets a
   * customers row so the choice sticks; before the SQL is run it is kept in this browser.
   */
  async setOffers({ id, name, phone }, allow) {
    const stamp = new Date().toISOString();
    const changes = allow
      ? { wa_optin: true, wa_optin_at: stamp, wa_optout_at: null }
      : { wa_optin: false, wa_optout_at: stamp };
    try {
      if (id) return unwrap(await supabase.from("customers").update(changes).eq("id", id).select());
      return unwrap(await supabase.from("customers").insert([{ name, phone: toPhone(phone), ...changes }]).select());
    } catch (error) {
      if (!isMissingColumn(error)) throw error;
      keepLocally({ name, phone }, changes);
      return [];
    }
  },

  async remove(id) {
    return unwrap(await supabase.from("customers").delete().eq("id", id));
  },
};
