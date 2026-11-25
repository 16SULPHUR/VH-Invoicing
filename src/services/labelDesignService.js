import { supabase, unwrap } from "@/lib/supabase";
import { isMissingTable } from "@/lib/supabaseErrors";
import { normalizeDesign, seedDesigns } from "@/features/inventory/stickers/designModel";

const TABLE = "label_designs";
const LOCAL_KEY = "vh.labelDesigns";
const COLUMNS = ["id", "name", "is_default", "size", "elements", "variables", "default_for", "updated_at"];

function readLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY));
    return {
      designs: (stored?.designs ?? []).map(normalizeDesign),
      dirty: stored?.dirty ?? [],
      deleted: stored?.deleted ?? [],
    };
  } catch {
    return { designs: [], dirty: [], deleted: [] };
  }
}

function writeLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

const toRow = (design) => Object.fromEntries(COLUMNS.map((column) => [column, design[column]]));
const storedFor = (error) => (isMissingTable(error) ? "device" : "offline");

/** Pushes edits made while offline or before the table existed. */
async function flush(local) {
  if (local.deleted.length > 0) {
    unwrap(await supabase.from(TABLE).delete().in("id", local.deleted));
    local.deleted = [];
  }
  const dirty = local.designs.filter((design) => local.dirty.includes(design.id));
  if (dirty.length > 0) {
    unwrap(await supabase.from(TABLE).upsert(dirty.map(toRow)));
    local.dirty = [];
  }
}

/**
 * Saved sticker designs. Supabase is the source of truth once docs/schema/sticker_designer.sql
 * has run; this browser keeps a full copy for offline use and for before that. The first load
 * seeds the three original sticker styles.
 */
export const labelDesignService = {
  cached() {
    const { designs } = readLocal();
    return designs.length > 0 ? designs : seedDesigns();
  },

  async list() {
    const local = readLocal();
    try {
      await flush(local);
      let rows = unwrap(await supabase.from(TABLE).select()) || [];
      if (rows.length === 0) {
        rows = local.designs.length > 0 ? local.designs : seedDesigns();
        unwrap(await supabase.from(TABLE).upsert(rows.map(toRow)));
      }
      const designs = rows.map(normalizeDesign).sort((a, b) => a.name.localeCompare(b.name));
      writeLocal({ designs, dirty: [], deleted: [] });
      return { designs, stored: "cloud" };
    } catch (error) {
      const designs = local.designs.length > 0 ? local.designs : seedDesigns();
      const dirty = isMissingTable(error) ? designs.map(({ id }) => id) : local.dirty;
      writeLocal({ ...local, designs, dirty: [...new Set([...local.dirty, ...dirty])] });
      return { designs, stored: storedFor(error) };
    }
  },

  /** Saves on this device at once, then in Supabase. Returns where it is stored now. */
  async save(changed) {
    const local = readLocal();
    const byId = new Map(local.designs.map((design) => [design.id, design]));
    changed.forEach((design) => byId.set(design.id, normalizeDesign(design)));
    local.designs = [...byId.values()];
    local.dirty = [...new Set([...local.dirty, ...changed.map(({ id }) => id)])];
    if (!writeLocal(local)) throw new Error("This browser's storage is full. Remove a large photo from the design.");
    try {
      await flush(local);
      writeLocal(local);
      return "cloud";
    } catch (error) {
      return storedFor(error);
    }
  },

  async remove(id) {
    const local = readLocal();
    local.designs = local.designs.filter((design) => design.id !== id);
    local.dirty = local.dirty.filter((dirtyId) => dirtyId !== id);
    local.deleted = [...new Set([...local.deleted, id])];
    writeLocal(local);
    try {
      await flush(local);
      writeLocal(local);
      return "cloud";
    } catch (error) {
      return storedFor(error);
    }
  },
};
