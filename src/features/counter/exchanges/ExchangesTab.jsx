import { useMemo, useState } from "react";
import { QrCode, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { formatRupees } from "@/utils/formatters";
import { Chips } from "../components/Chips";
import { DueText, ListToolbar, RecordRow, StatStrip, StatusPill } from "../components/Bits";
import { ScanSheet } from "../components/ScanSheet";
import { useToolRecords } from "../hooks/useShopTools";
import { daysUntil, formatPhone, matchesRecord } from "../lib/shopTools";
import { CREDIT_STATUS, creditBalance, isExpired, isUsable } from "../lib/credit";
import { CreditNoteSheet } from "./CreditNoteSheet";
import { ExchangeSheet } from "./ExchangeSheet";

export default function ExchangesTab() {
  const notes = useToolRecords("credit_notes", true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [taking, setTaking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [openId, setOpenId] = useState(null);

  const groups = useMemo(
    () => ({
      open: notes.data.filter(isUsable),
      used: notes.data.filter((note) => !isUsable(note)),
    }),
    [notes.data]
  );

  const shown = search.trim() ? notes.data.filter((note) => matchesRecord(note, search)) : groups[filter];
  const note = openId ? notes.data.find((item) => item.id === openId) ?? null : null;
  const outstanding = groups.open.reduce((sum, item) => sum + creditBalance(item), 0);
  const expiringSoon = groups.open.filter((item) => {
    const days = daysUntil(item.expires_on);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  const onCode = (code) => {
    const found = notes.data.find((item) => item.token.toLowerCase() === code.trim().toLowerCase());
    if (!found) return { ok: false, message: `${code} is not a credit note` };
    setScanning(false);
    setOpenId(found.id);
    return { ok: true, message: `Found ${found.token}` };
  };

  return (
    <div className="space-y-4">
      <ListToolbar search={search} onSearch={setSearch} placeholder="Credit note no., name or phone…" onNew={() => setTaking(true)} newLabel="Take back">
        <Button variant="outline" className="press h-10" onClick={() => setScanning(true)}>
          <QrCode className="h-4 w-4" aria-hidden /> Scan note
        </Button>
      </ListToolbar>

      <StatStrip
        items={[
          { label: "Open notes", value: groups.open.length },
          { label: "Owed as credit", value: formatRupees(outstanding), tone: outstanding ? "text-credit" : "" },
          { label: "Expiring in 30 days", value: expiringSoon, tone: expiringSoon ? "text-warning" : "" },
        ]}
      />

      {!search.trim() && (
        <Chips
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "With balance", count: groups.open.length },
            { value: "used", label: "Used or void" },
          ]}
        />
      )}

      {notes.isLoading ? (
        <PageLoader label="Loading credit notes…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          title={search.trim() ? "No credit note matches" : filter === "open" ? "No open credit notes" : "Nothing here yet"}
          description="Take a piece back with Take back: it goes into stock and the customer gets a credit note with a QR code."
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => {
            const status = CREDIT_STATUS[item.status] ?? CREDIT_STATUS.open;
            const expired = isExpired(item) && item.status === "open";
            return (
              <RecordRow
                key={item.id}
                token={item.token}
                title={item.customer_name || "Walk-in"}
                pill={<StatusPill tone={expired ? "red" : status.tone}>{expired ? "Expired" : status.label}</StatusPill>}
                subtitle={[item.lines.map((line) => line.name).join(", ") || item.note, formatPhone(item.customer_phone)].filter(Boolean).join(" · ")}
                due={item.expires_on && isUsable(item) && !expired ? <DueText date={item.expires_on} prefix="Valid till " /> : null}
                amount={formatRupees(isUsable(item) ? creditBalance(item) : item.amount)}
                amountLabel={isUsable(item) ? "balance" : "value"}
                onClick={() => setOpenId(item.id)}
              />
            );
          })}
        </ul>
      )}

      <ExchangeSheet open={taking} onClose={() => setTaking(false)} onSaved={(saved) => { setTaking(false); setOpenId(saved.id); }} />
      <CreditNoteSheet open={Boolean(note)} note={note} onClose={() => setOpenId(null)} />
      <ScanSheet open={scanning} onClose={() => setScanning(false)} onCode={onCode} title="Scan a credit note" description="Hold the QR code on the credit note in the box." />
    </div>
  );
}
