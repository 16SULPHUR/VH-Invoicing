import { useMemo, useState } from "react";
import { Scissors } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { formatRupees } from "@/utils/formatters";
import { Chips } from "../components/Chips";
import { DueText, ListToolbar, RecordRow, StatStrip, StatusPill } from "../components/Bits";
import { useToolRecords } from "../hooks/useShopTools";
import { daysUntil, formatPhone, matchesRecord } from "../lib/shopTools";
import { isOpenJob, jobBalance, kindLabel, statusOf } from "../lib/jobs";
import { JobSheet } from "./JobSheet";

const isLate = (job) => job.status !== "ready" && isOpenJob(job) && (daysUntil(job.ready_on) ?? 0) < 0;
const byReadyDate = (a, b) => String(a.ready_on ?? "9999").localeCompare(String(b.ready_on ?? "9999"));

export default function AlterationsTab() {
  const jobs = useToolRecords("service_jobs", true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [sheet, setSheet] = useState({ open: false, id: null });

  const groups = useMemo(() => {
    const open = jobs.data.filter(isOpenJob);
    return {
      open: [...open].sort(byReadyDate),
      late: open.filter(isLate).sort(byReadyDate),
      ready: open.filter((job) => job.status === "ready").sort(byReadyDate),
      delivered: jobs.data
        .filter((job) => !isOpenJob(job))
        .sort((a, b) => String(b.delivered_at ?? b.updated_at).localeCompare(String(a.delivered_at ?? a.updated_at))),
    };
  }, [jobs.data]);

  const tailors = useMemo(
    () => [...new Set(jobs.data.map((job) => job.tailor?.trim()).filter(Boolean))].sort(),
    [jobs.data]
  );

  const shown = search.trim() ? jobs.data.filter((job) => matchesRecord(job, search)).sort(byReadyDate) : groups[filter];
  const job = sheet.id ? jobs.data.find((item) => item.id === sheet.id) ?? null : null;
  const dueToday = groups.open.filter((item) => item.status !== "ready" && daysUntil(item.ready_on) === 0).length;

  return (
    <div className="space-y-4">
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Token, name or phone…"
        onNew={() => setSheet({ open: true, id: null })}
        newLabel="New job"
      />

      <StatStrip
        items={[
          { label: "Due today", value: dueToday, tone: dueToday ? "text-warning" : "" },
          { label: "Late", value: groups.late.length, tone: groups.late.length ? "text-destructive" : "" },
          { label: "Ready", value: groups.ready.length, tone: groups.ready.length ? "text-leaf" : "" },
        ]}
      />

      {!search.trim() && (
        <Chips
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Open", count: groups.open.length },
            { value: "late", label: "Late", count: groups.late.length, alert: true },
            { value: "ready", label: "Ready", count: groups.ready.length },
            { value: "delivered", label: "Delivered" },
          ]}
        />
      )}

      {jobs.isLoading ? (
        <PageLoader label="Loading jobs…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={search.trim() ? "No job matches" : filter === "open" ? "No open jobs" : "Nothing here"}
          description="Take in a saree for fall-pico, a blouse to stitch or an alteration with New job."
        />
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => {
            const status = statusOf(item.status);
            const balance = jobBalance(item);
            return (
              <RecordRow
                key={item.id}
                token={item.token}
                title={item.customer_name || "Customer"}
                pill={<StatusPill tone={status.tone}>{status.label}</StatusPill>}
                subtitle={[kindLabel(item.kind), item.items, formatPhone(item.customer_phone)].filter(Boolean).join(" · ")}
                due={
                  item.status === "delivered" ? (
                    <span className="text-muted-foreground">Delivered</span>
                  ) : (
                    <DueText date={item.ready_on} done={item.status === "ready"} prefix="Ready " />
                  )
                }
                late={isLate(item)}
                amount={balance > 0 ? formatRupees(balance) : "Paid"}
                amountLabel={balance > 0 ? "balance" : undefined}
                onClick={() => setSheet({ open: true, id: item.id })}
              />
            );
          })}
        </ul>
      )}

      <JobSheet
        open={sheet.open}
        job={job}
        tailors={tailors}
        onClose={() => setSheet({ open: false, id: null })}
        onSaved={(saved) => setSheet({ open: false, id: saved.id })}
      />
    </div>
  );
}
