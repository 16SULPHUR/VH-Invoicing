import { useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { formatRupees } from "@/utils/formatters";
import { Chips } from "../components/Chips";
import { DueText, ListToolbar, RecordRow, StatStrip, StatusPill } from "../components/Bits";
import { useToolRecords } from "../hooks/useShopTools";
import { daysUntil, formatPhone, matchesRecord } from "../lib/shopTools";
import { outCount, outValue } from "../lib/approvals";
import { ApprovalSheet } from "./ApprovalSheet";

const isLate = (approval) => approval.status === "open" && (daysUntil(approval.due_on) ?? 0) < 0;
const byDue = (a, b) => String(a.due_on ?? "9999").localeCompare(String(b.due_on ?? "9999"));

export default function ApprovalsTab() {
  const approvals = useToolRecords("approvals", true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [sheet, setSheet] = useState({ open: false, id: null });

  const groups = useMemo(() => {
    const open = approvals.data.filter((item) => item.status === "open").sort(byDue);
    return {
      open,
      late: open.filter(isLate),
      closed: approvals.data.filter((item) => item.status === "closed"),
    };
  }, [approvals.data]);

  const shown = search.trim() ? approvals.data.filter((item) => matchesRecord(item, search)).sort(byDue) : groups[filter];
  const approval = sheet.id ? approvals.data.find((item) => item.id === sheet.id) ?? null : null;
  const piecesOut = groups.open.reduce((sum, item) => sum + outCount(item), 0);
  const valueOut = groups.open.reduce((sum, item) => sum + outValue(item), 0);

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Jangad no., name or phone…"
        onNew={() => setSheet({ open: true, id: null })}
        newLabel="Give on approval"
      />

      <StatStrip
        items={[
          { label: "Pieces out", value: piecesOut },
          { label: "Worth", value: formatRupees(valueOut) },
          { label: "Late", value: groups.late.length, tone: groups.late.length ? "text-destructive" : "" },
        ]}
      />

      {!search.trim() && (
        <Chips
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Out now", count: groups.open.length },
            { value: "late", label: "Late", count: groups.late.length, alert: true },
            { value: "closed", label: "Settled" },
          ]}
        />
      )}

      {approvals.isLoading ? (
        <PageLoader label="Loading…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={search.trim() ? "Nothing matches" : filter === "closed" ? "Nothing settled yet" : "Nothing out on approval"}
          description="When a customer takes pieces home to decide, scan them here so stock and the due date are tracked."
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => {
            const out = outCount(item);
            return (
              <RecordRow
                key={item.id}
                token={item.token}
                title={item.customer_name || "Customer"}
                pill={item.status === "closed" ? <StatusPill>Settled</StatusPill> : null}
                subtitle={[
                  item.status === "open" ? `${out} of ${item.lines.reduce((sum, line) => sum + line.quantity, 0)} pieces out` : `${item.lines.length} lines`,
                  formatPhone(item.customer_phone),
                ]
                  .filter(Boolean)
                  .join(" · ")}
                due={item.status === "open" ? <DueText date={item.due_on} prefix="Due " /> : null}
                late={isLate(item)}
                amount={item.status === "open" ? formatRupees(outValue(item)) : undefined}
                amountLabel={item.status === "open" ? "out" : undefined}
                onClick={() => setSheet({ open: true, id: item.id })}
              />
            );
          })}
        </ul>
      )}

      <ApprovalSheet
        open={sheet.open}
        approval={approval}
        onClose={() => setSheet({ open: false, id: null })}
        onSaved={(saved) => setSheet({ open: false, id: saved.id })}
      />
    </div>
  );
}
