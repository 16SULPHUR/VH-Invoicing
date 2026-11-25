import { Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";

/** Shown in place of a tool until docs/schema/shop_tools.sql has been run. */
export function SetupNotice({ setup, what }) {
  if (setup.isLoading) return <PageLoader label="Checking…" />;

  if (setup.error) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-surface/70 p-6 text-center">
        <p className="font-display text-lg font-bold">Couldn&apos;t reach Supabase</p>
        <p className="mt-1 text-sm text-muted-foreground">{what} need the internet. {setup.error.message}</p>
        <Button variant="outline" className="press mt-4" onClick={() => setup.retry()}>
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-marigold/70 bg-marigold/10 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-marigold text-marigold-foreground">
          <Database className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="font-display text-lg font-bold leading-tight">Run shop_tools.sql to turn on {what.toLowerCase()}</p>
          <p className="text-sm text-muted-foreground">
            These records are shared by every phone and the till, so they live in Supabase. Open Supabase, go to the
            SQL editor, paste <code className="rounded bg-surface px-1 font-mono text-[13px] text-foreground">docs/schema/shop_tools.sql</code>{" "}
            and press Run. It is safe to run more than once and does not change bills.
          </p>
          {setup.missing.length > 0 && (
            <p className="text-xs text-muted-foreground">Missing now: {setup.missing.join(", ")}</p>
          )}
          <Button variant="outline" className="press" onClick={() => setup.retry()}>
            <RefreshCw className="h-4 w-4" aria-hidden /> Check again
          </Button>
        </div>
      </div>
    </div>
  );
}
