import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { nonSalePatternService } from "@/services/reportService";
import { GstSettingsPanel } from "@/features/reports/components/GstSettingsPanel";
import { useGstSettings } from "@/features/reports/hooks/useGstSettings";
import { DEFAULT_NON_SALE } from "@/features/reports/lib/lines";
import { Section } from "../components/fields";

function Choice({ label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="inline-flex rounded-full border border-border bg-surface p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`press rounded-full px-4 py-1.5 text-sm font-semibold ${value === option.value ? "bg-indigo text-white" : "text-muted-foreground"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GstSection() {
  const { gst, save } = useGstSettings();
  const patterns = useQuery({ queryKey: queryKeys.reports.nonSale, queryFn: nonSalePatternService.list, staleTime: 5 * 60_000, retry: false });

  return (
    <div className="space-y-4">
      <Section title="Registration" description="Bill prices include GST. Changing these only changes how reports and GSTR-1 files are made.">
        <div className="flex flex-wrap gap-6">
          <Choice
            label="Scheme"
            value={gst.scheme}
            onChange={(scheme) => save({ scheme })}
            options={[
              { value: "regular", label: "Regular" },
              { value: "composition", label: "Composition" },
            ]}
          />
          <Choice
            label="GSTR-1 filing"
            value={gst.frequency}
            onChange={(frequency) => save({ frequency })}
            options={[
              { value: "quarterly", label: "Quarterly" },
              { value: "monthly", label: "Monthly" },
            ]}
          />
        </div>
      </Section>
      <GstSettingsPanel nonSalePatterns={patterns.data ?? DEFAULT_NON_SALE} patternsShared={Array.isArray(patterns.data)} />
    </div>
  );
}
