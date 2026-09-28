import { useSearchParams } from "react-router-dom";
import { resolveRange } from "./reportRange";

/** The reports' date range lives in the URL so it survives switching report tabs. */
export function useReportRange() {
  const [params, setParams] = useSearchParams();
  const preset = params.get("range") ?? "fy";
  const custom = { from: params.get("from") ?? "", to: params.get("to") ?? "" };

  const update = (changes) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        return next;
      },
      { replace: true }
    );

  return {
    preset,
    custom,
    range: resolveRange(preset, custom),
    setPreset: (value) => update({ range: value }),
    setCustom: (bound, value) => update({ range: "custom", [bound]: value }),
  };
}
