import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { formatRupees } from "@/utils/formatters";
import { Chips } from "../components/Chips";
import { DueText, ListToolbar, RecordRow, StatStrip, StatusPill } from "../components/Bits";
import { useToolRecords } from "../hooks/useShopTools";
import { daysUntil, formatPhone, matchesRecord, pieceCount } from "../lib/shopTools";
import { bookingBalance, bookingStatus, isLateBooking, isOpenBooking } from "../lib/bookings";
import { BookingSheet } from "./BookingSheet";

const byPickup = (a, b) => String(a.pickup_on ?? "9999").localeCompare(String(b.pickup_on ?? "9999"));

export default function BookingsTab() {
  const bookings = useToolRecords("bookings", true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [sheet, setSheet] = useState({ open: false, id: null });

  const groups = useMemo(() => {
    const open = bookings.data.filter(isOpenBooking).sort(byPickup);
    return {
      open,
      ready: open.filter((item) => item.status === "ready"),
      late: open.filter(isLateBooking),
      done: bookings.data.filter((item) => !isOpenBooking(item)),
    };
  }, [bookings.data]);

  const shown = search.trim() ? bookings.data.filter((item) => matchesRecord(item, search)).sort(byPickup) : groups[filter];
  const booking = sheet.id ? bookings.data.find((item) => item.id === sheet.id) ?? null : null;
  const advanceHeld = groups.open.reduce((sum, item) => sum + (Number(item.advance) || 0), 0);
  const thisWeek = groups.open.filter((item) => {
    const days = daysUntil(item.pickup_on);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Booking no., name or phone…"
        onNew={() => setSheet({ open: true, id: null })}
        newLabel="New booking"
      />

      <StatStrip
        items={[
          { label: "Pickups this week", value: thisWeek },
          { label: "Advance held", value: formatRupees(advanceHeld) },
          { label: "Late", value: groups.late.length, tone: groups.late.length ? "text-destructive" : "" },
        ]}
      />

      {!search.trim() && (
        <Chips
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Open", count: groups.open.length },
            { value: "ready", label: "Ready", count: groups.ready.length },
            { value: "late", label: "Late", count: groups.late.length, alert: true },
            { value: "done", label: "Picked up or cancelled" },
          ]}
        />
      )}

      {bookings.isLoading ? (
        <PageLoader label="Loading bookings…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={search.trim() ? "No booking matches" : "No bookings here"}
          description="Hold a piece against an advance, or take a wedding order, with New booking."
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => {
            const status = bookingStatus(item.status);
            const balance = bookingBalance(item);
            return (
              <RecordRow
                key={item.id}
                token={item.token}
                title={item.customer_name || "Customer"}
                pill={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
                subtitle={[`${pieceCount(item.lines)} item${pieceCount(item.lines) === 1 ? "" : "s"}`, item.lines[0]?.name, formatPhone(item.customer_phone)].filter(Boolean).join(" · ")}
                due={isOpenBooking(item) ? <DueText date={item.pickup_on} prefix="Pickup " /> : null}
                late={isLateBooking(item)}
                amount={isOpenBooking(item) ? formatRupees(balance) : formatRupees(item.total)}
                amountLabel={isOpenBooking(item) ? "balance" : "total"}
                onClick={() => setSheet({ open: true, id: item.id })}
              />
            );
          })}
        </ul>
      )}

      <BookingSheet
        open={sheet.open}
        booking={booking}
        onClose={() => setSheet({ open: false, id: null })}
        onSaved={(saved) => setSheet({ open: false, id: saved.id })}
      />
    </div>
  );
}
