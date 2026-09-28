import { supabase, unwrap } from "@/lib/supabase";

const TABLE = "print_jobs";
const PRESENCE_CHANNEL = "print-stations";
const MISSING_TABLE = new Set(["PGRST205", "42P01"]);

export const PRINT_JOB_STATUS = {
  PENDING: "pending",
  CLAIMED: "claimed",
  SAVED: "saved",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

export function isPrintQueueMissing(error) {
  return MISSING_TABLE.has(error?.code);
}

export const printJobService = {
  async create(job) {
    return unwrap(await supabase.from(TABLE).insert([job]).select().single());
  },

  async get(id) {
    return unwrap(await supabase.from(TABLE).select().eq("id", id).single());
  },

  async listOpen() {
    return (
      unwrap(
        await supabase
          .from(TABLE)
          .select()
          .in("status", [PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.CLAIMED])
          .order("created_at", { ascending: true })
      ) || []
    );
  },

  async listRecent(limit = 15) {
    return (
      unwrap(
        await supabase.from(TABLE).select().order("created_at", { ascending: false }).limit(limit)
      ) || []
    );
  },

  async claim(id, station) {
    const data = unwrap(await supabase.rpc("claim_print_job", { p_id: id, p_station: station }));
    return data?.id ? data : null;
  },

  async finish(id, bill) {
    return unwrap(await supabase.rpc("finish_print_job", { p_id: id, p_bill: bill }));
  },

  async fail(id, error) {
    return unwrap(
      await supabase
        .from(TABLE)
        .update({ status: PRINT_JOB_STATUS.FAILED, error, updated_at: new Date().toISOString() })
        .eq("id", id)
        .is("invoice_id", null)
    );
  },

  async retry(id) {
    return unwrap(
      await supabase
        .from(TABLE)
        .update({
          status: PRINT_JOB_STATUS.PENDING,
          error: null,
          station: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", PRINT_JOB_STATUS.FAILED)
    );
  },

  /** Only a job no till has picked up yet can be cancelled. Returns false otherwise. */
  async cancel(id) {
    const rows = unwrap(
      await supabase
        .from(TABLE)
        .update({ status: PRINT_JOB_STATUS.CANCELLED, updated_at: new Date().toISOString() })
        .eq("id", id)
        .in("status", [PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.FAILED])
        .select()
    );
    return rows.length > 0;
  },

  subscribe(onChange, { id } = {}) {
    const channel = supabase
      .channel(`print-jobs-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE, ...(id && { filter: `id=eq.${id}` }) },
        onChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") onChange({ eventType: "SUBSCRIBED" });
      });
    return () => supabase.removeChannel(channel);
  },

  /** Tills announce themselves here and phones read who is online. Returns an unsubscribe. */
  watchStations(onSync) {
    const state = presenceChannel();
    state.listeners.add(onSync);
    onSync(state.stations);
    return () => state.listeners.delete(onSync);
  },

  announceStation(station) {
    const state = presenceChannel();
    state.station = station;
    if (state.joined) state.channel.track(stationPayload(station));
    return () => {
      if (state.station !== station) return;
      state.station = null;
      state.channel.untrack();
    };
  },
};

const stationPayload = (station) => ({
  station: station.id,
  name: station.name,
  since: Date.now(),
});

// One channel for the app's lifetime: the client reuses channels by name, so re-creating
// it on every mount can hand back one that is still being torn down.
let presence = null;
function presenceChannel() {
  if (presence) return presence;
  const channel = supabase.channel(PRESENCE_CHANNEL);
  presence = { channel, listeners: new Set(), stations: [], station: null, joined: false };

  channel.on("presence", { event: "sync" }, () => {
    presence.stations = Object.values(channel.presenceState())
      .flat()
      .filter((entry) => entry.station);
    presence.listeners.forEach((listener) => listener(presence.stations));
  });
  channel.subscribe((status) => {
    presence.joined = status === "SUBSCRIBED";
    if (presence.joined && presence.station) channel.track(stationPayload(presence.station));
  });
  return presence;
}
