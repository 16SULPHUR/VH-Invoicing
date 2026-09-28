import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileJson, Info, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/queryClient";
import { reportService } from "@/services/reportService";
import { useShopSettings } from "@/features/settings/useShopSettings";
import { downloadCsv, toCsv } from "@/utils/csv";
import { computeGst, creditNoteDocs, gstr1Json, netPayable, offlineToolCsv, returnPeriod } from "../lib/gst";
import { gstChecks } from "../lib/gstChecks";
import { defaultGstPeriod, dueDates, fyLabel, fyOf, monthOptions, periodFy, quarterOptions, resolveGstPeriod } from "../lib/gstPeriod";
import { printGstSummary } from "../lib/gstPrint";
import { dayYearLabel, rupees2 } from "../lib/format";
import { iso } from "../range/reportRange";
import { useReportData } from "../hooks/useReportData";
import { useGstSettings } from "../hooks/useGstSettings";
import { ReportShell } from "../components/ReportShell";
import { CsvButton, DataTable, Kpi, Panel, Pills } from "../components/ReportUI";
import { GstSettingsPanel } from "../components/GstSettingsPanel";
import { ItemHsnPanel } from "../components/ItemHsnPanel";

const LEVEL = {
  fix: { Icon: AlertTriangle, cls: "border-destructive/40 bg-destructive/5 text-destructive" },
  check: { Icon: AlertTriangle, cls: "border-marigold/60 bg-marigold/10 text-warning" },
  info: { Icon: Info, cls: "border-border bg-surface-elevated text-indigo" },
};

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`press h-8 shrink-0 rounded-full border-[1.5px] px-3 text-xs font-bold transition-colors ${active ? "border-indigo bg-indigo text-white" : "border-border bg-surface hover:border-indigo/40"}`}
    >
      {children}
    </button>
  );
}

function PeriodPicker({ value, onChange }) {
  const fy = periodFy(value);
  const currentFy = fyOf(new Date());
  const years = Array.from({ length: currentFy - 2023 }, (_, i) => currentFy - i);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        aria-label="Financial year"
        value={fy}
        onChange={(e) => onChange(`${e.target.value}-Q1`)}
        className="h-8 rounded-full border-[1.5px] border-border px-3 text-xs font-bold"
      >
        {years.map((y) => (
          <option key={y} value={y}>FY {fyLabel(y)}</option>
        ))}
      </select>
      {monthOptions(fy).map((m) => (
        <Chip key={m.value} active={value === m.value} onClick={() => onChange(m.value)}>{m.label}</Chip>
      ))}
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      {quarterOptions(fy).map((q) => (
        <Chip key={q.value} active={value === q.value} onClick={() => onChange(q.value)}>{q.label}</Chip>
      ))}
      <Chip active={value === `${fy}-FY`} onClick={() => onChange(`${fy}-FY`)}>Full year</Chip>
    </div>
  );
}

const money = (key, header) => ({ key, header, align: "right", render: (r) => rupees2(r[key]) });

export default function GstReportPage() {
  const [params, setParams] = useSearchParams();
  const { gst: settings, save } = useGstSettings();
  const periodKey = params.get("gp") ?? defaultGstPeriod(settings.frequency);
  const period = resolveGstPeriod(periodKey);
  const setPeriod = (key) => setParams((p) => { const n = new URLSearchParams(p); n.set("gp", key); return n; }, { replace: true });

  const data = useReportData();
  const { settings: shop } = useShopSettings();
  const range = { from: period.from, to: period.to };

  const ledger = useQuery({ queryKey: queryKeys.reports.ledgerGst(range.from, range.to), queryFn: () => reportService.ledgerGst(range), staleTime: 60_000, retry: false });
  const notes = useQuery({ queryKey: queryKeys.reports.creditNotes(range.from, range.to), queryFn: () => reportService.creditNotes(range), staleTime: 60_000 });

  const bills = useMemo(() => data.pick(range), [data.all, range.from, range.to]); // eslint-disable-line react-hooks/exhaustive-deps
  const creditNotes = useMemo(() => creditNoteDocs(notes.data ?? []), [notes.data]);
  const gst = useMemo(() => computeGst(bills, settings, creditNotes), [bills, settings, creditNotes]);
  const itc = settings.itc?.[periodKey] ?? {};
  const payable = netPayable(gst.summary, itc);
  const checks = gstChecks({ gst, bills, ledgerGst: ledger.data, settings, period, today: iso(new Date()), creditNotes });
  const due = dueDates(period);
  const fp = returnPeriod(period.to);
  const csv = offlineToolCsv(gst, settings);
  const file = `${settings.gstin}_${fp}`;

  const setItc = (key, value) => save({ itc: { ...settings.itc, [periodKey]: { ...itc, [key]: Number(value) || 0 } } });

  const downloadJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(gstr1Json(gst, settings, fp), null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR1_${file}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const registerCsv = () =>
    downloadCsv(
      `sales_register_${file}.csv`,
      toCsv(
        ["Document", "Date", "Customer", "Invoice value", "Taxable value", "CGST", "SGST", "Rate %", "Non-sale lines", "Bill total"],
        gst.register.map((r) => [r.id, iso(r.date), r.customer, r.value.toFixed(2), r.taxable.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), r.rates, r.adjustments, r.total])
      )
    );

  const regular = !gst.composition;

  return (
    <ReportShell report={data}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">GSTIN {settings.gstin} · {regular ? "Regular" : "Composition"}</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{period.label}</h2>
          {due.gstr1 && regular && (
            <p className="text-sm text-muted-foreground">
              {period.kind === "month" && settings.frequency === "quarterly"
                ? "Quarterly filer: this month is filed with its quarter. Pay tax for the first two months of a quarter by the 25th with PMT-06."
                : `GSTR-1 due ${due.gstr1} · GSTR-3B due ${due.gstr3b}`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Pills
            label="Filing frequency"
            options={[{ value: "quarterly", label: "Quarterly filer" }, { value: "monthly", label: "Monthly filer" }]}
            value={settings.frequency}
            onChange={(frequency) => {
              save({ frequency });
              setPeriod(defaultGstPeriod(frequency));
            }}
          />
          <PeriodPicker value={periodKey} onChange={setPeriod} />
        </div>
      </div>

      {regular ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi label="Sales incl. GST" value={rupees2(gst.summary.value)} hint={`${gst.register.length} documents`} />
          <Kpi label="Taxable value" value={rupees2(gst.summary.taxable)} />
          <Kpi label="CGST" value={rupees2(gst.summary.cgst)} />
          <Kpi label="SGST" value={rupees2(gst.summary.sgst)} />
          <div className="col-span-2 lg:col-span-1">
            <Kpi tone="hero" label="Cash to pay" value={rupees2(payable.total)} hint="After input credit entered below" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Turnover" value={rupees2(gst.cmp08.turnover)} />
          <Kpi label="CGST 0.5%" value={rupees2(gst.cmp08.cgst)} />
          <Kpi label="SGST 0.5%" value={rupees2(gst.cmp08.sgst)} />
          <Kpi tone="hero" label="CMP-08 to pay" value={rupees2(gst.cmp08.cgst + gst.cmp08.sgst)} />
        </div>
      )}

      <Panel eyebrow="For the portal or your accountant" title="Download">
        <div className="flex flex-wrap gap-2">
          {regular && (
            <button type="button" onClick={downloadJson} className="press inline-flex h-10 items-center gap-2 rounded-full bg-rani px-4 text-sm font-bold text-white">
              <FileJson className="h-4 w-4" aria-hidden /> GSTR-1 JSON
            </button>
          )}
          <button
            type="button"
            onClick={() => printGstSummary({ gst, settings, period, shopName: shop.shop_name, payable, itc })}
            className="press inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-4 text-sm font-bold text-white"
          >
            <Printer className="h-4 w-4" aria-hidden /> Print summary
          </button>
          <button type="button" onClick={registerCsv} className="press inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-border px-4 text-sm font-bold hover:border-indigo/40">
            Sales register CSV
          </button>
          {regular && (
            <>
              <CsvButton filename={`b2cs_${file}.csv`} headers={csv.b2cs.headers} rows={csv.b2cs.rows} label="B2CS CSV" />
              <CsvButton filename={`hsn_b2c_${file}.csv`} headers={csv.hsn.headers} rows={csv.hsn.rows} label="HSN CSV" />
              <CsvButton filename={`docs_${file}.csv`} headers={csv.docs.headers} rows={csv.docs.rows} label="Docs CSV" />
            </>
          )}
        </div>
        {regular && (
          <p className="mt-3 text-xs text-muted-foreground">
            On the GST portal, open GSTR-1 for {period.kind === "quarter" ? "the quarter" : "the month"}, choose Prepare offline, and upload the JSON. The CSVs match the GST offline tool’s templates if you prefer that route.
          </p>
        )}
      </Panel>

      <Panel eyebrow="Look at these before filing" title="Checks">
        <ul className="space-y-2">
          {checks.map((c, i) => {
            const { Icon, cls } = LEVEL[c.level];
            return (
              <li key={i} className={`flex gap-3 rounded-xl border p-3 ${cls}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <div className="text-sm text-foreground">
                  <p className="font-bold">{c.title}</p>
                  <p className="text-muted-foreground">{c.text}</p>
                </div>
              </li>
            );
          })}
          {checks.length === 0 && (
            <li className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Nothing needs attention.
            </li>
          )}
        </ul>
      </Panel>

      {regular && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel eyebrow="GSTR-3B" title="3.1 Outward supplies and tax to pay">
            <div className="-mx-4 overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-y border-border bg-surface-elevated text-right text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                    <th className="px-4 py-2 text-left">Row</th><th className="px-3 py-2">Taxable</th><th className="px-3 py-2">IGST</th><th className="px-3 py-2">CGST</th><th className="px-4 py-2">SGST</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  <tr className="border-b border-border/60 text-right">
                    <td className="px-4 py-2 text-left font-semibold">(a) Outward taxable</td>
                    <td className="px-3 py-2">{rupees2(gst.summary.taxable)}</td><td className="px-3 py-2">0</td><td className="px-3 py-2">{rupees2(gst.summary.cgst)}</td><td className="px-4 py-2">{rupees2(gst.summary.sgst)}</td>
                  </tr>
                  {["(b) Zero rated", "(c) Nil rated, exempted", "(d) Inward, reverse charge", "(e) Non-GST"].map((row) => (
                    <tr key={row} className="border-b border-border/60 text-right text-muted-foreground">
                      <td className="px-4 py-2 text-left">{row}</td><td className="px-3 py-2">0</td><td className="px-3 py-2">0</td><td className="px-3 py-2">0</td><td className="px-4 py-2">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 font-display font-bold">4. Input credit from your GSTR-2B</p>
            <p className="text-xs text-muted-foreground">Type what the portal shows as available for this period. It is saved with the period.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["igst", "cgst", "sgst"].map((key) => (
                <label key={`${periodKey}-${key}`} className="block">
                  <span className="eyebrow">{key.toUpperCase()}</span>
                  <Input type="number" min="0" step="0.01" defaultValue={itc[key] ?? ""} onBlur={(e) => setItc(key, e.target.value)} className="mt-1 h-9 text-sm" />
                </label>
              ))}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-indigo/5 p-3 text-sm">
              <div><dt className="eyebrow">CGST to pay</dt><dd className="font-bold tabular-nums">{rupees2(payable.cgst)}</dd></div>
              <div><dt className="eyebrow">SGST to pay</dt><dd className="font-bold tabular-nums">{rupees2(payable.sgst)}</dd></div>
              <div><dt className="eyebrow">Total</dt><dd className="font-bold tabular-nums text-rani">{rupees2(payable.total)}</dd></div>
            </dl>
          </Panel>

          <Panel eyebrow="GSTR-1 table 7" title="B2C (others)">
            <DataTable
              columns={[
                { key: "pos", header: "Place of supply", render: () => `${settings.stateCode}-${settings.stateName}`, csv: () => `${settings.stateCode}-${settings.stateName}` },
                { key: "rate", header: "Rate", align: "right", render: (r) => `${r.rate}%` },
                money("value", "Value incl. GST"),
                money("taxable", "Taxable"),
                money("cgst", "CGST"),
                money("sgst", "SGST"),
              ]}
              rows={gst.b2cs}
              rowKey={(r) => r.rate}
            />
            <p className="mt-4 text-xs text-muted-foreground">No B2B or B2C large invoices: bills carry no customer GSTIN, and every sale is within {settings.stateName}.</p>
          </Panel>
        </div>
      )}

      {regular && (
        <div className="grid gap-4 2xl:grid-cols-[1.4fr_1fr]">
          <Panel eyebrow="GSTR-1 table 12" title="HSN summary (B2C)">
            <DataTable
              columns={[
                { key: "hsn", header: "HSN", className: "font-bold" },
                { key: "description", header: "Description" },
                { key: "quantity", header: `Qty (${settings.uqc})`, align: "right" },
                { key: "rate", header: "Rate", align: "right", render: (r) => `${r.rate}%` },
                money("value", "Value"),
                money("taxable", "Taxable"),
                money("cgst", "CGST"),
                money("sgst", "SGST"),
              ]}
              rows={gst.hsn}
              rowKey={(r) => `${r.hsn}-${r.rate}`}
            />
          </Panel>
          <Panel eyebrow="GSTR-1 table 13" title="Documents issued">
            <DataTable
              columns={[
                { key: "nature", header: "Nature" },
                { key: "from", header: "From", align: "right" },
                { key: "to", header: "To", align: "right" },
                { key: "total", header: "Total", align: "right" },
                { key: "cancelled", header: "Cancelled", align: "right" },
                { key: "issued", header: "Net", align: "right" },
              ]}
              rows={[...gst.documents.map((d) => ({ ...d, nature: `Invoices (FY ${d.fy})` })), ...gst.creditNoteDocs.map((d) => ({ ...d, nature: "Credit notes" }))]}
              rowKey={(r) => `${r.nature}-${r.from}`}
            />
          </Panel>
        </div>
      )}

      {regular && <ItemHsnPanel bills={[...bills, ...creditNotes.filter((n) => !n.void)]} settings={settings} save={save} />}

      <Panel eyebrow="Every bill and credit note with its tax" title="Sales register">
        <DataTable
          columns={[
            { key: "id", header: "Doc", className: "font-bold" },
            { key: "date", header: "Date", value: (r) => r.date, render: (r) => dayYearLabel(r.date), csv: (r) => iso(r.date) },
            { key: "customer", header: "Customer" },
            money("value", "Value"),
            money("taxable", "Taxable"),
            money("cgst", "CGST"),
            money("sgst", "SGST"),
            { key: "adjustments", header: "Non-sale", align: "right", render: (r) => (r.adjustments ? rupees2(r.adjustments) : "—") },
          ]}
          rows={gst.register}
          limit={20}
          rowKey={(r) => `${r.id}-${r.date.getTime()}`}
        />
      </Panel>

      <GstSettingsPanel nonSalePatterns={data.nonSalePatterns} patternsShared={data.patternsShared} />
      <p className="text-xs text-muted-foreground">
        Scheme: {regular ? "Regular" : "Composition"}.{" "}
        <button type="button" className="font-bold text-rani hover:underline" onClick={() => save({ scheme: regular ? "composition" : "regular" })}>
          Switch to {regular ? "composition" : "regular"}
        </button>
      </p>
    </ReportShell>
  );
}
