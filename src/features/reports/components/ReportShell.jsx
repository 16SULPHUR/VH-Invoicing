import { TileSkeleton } from "@/components/common/Skeletons";
import { ErrorNote } from "./ReportUI";

export function ReportShell({ report, children }) {
  if (report.error) return <div className="p-4 md:p-6"><ErrorNote error={report.error} /></div>;
  if (report.isLoading) return <div className="space-y-4 p-4 md:p-6"><TileSkeleton count={6} /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>;
  return <div className="space-y-4 p-4 pb-10 md:p-6">{children}</div>;
}
