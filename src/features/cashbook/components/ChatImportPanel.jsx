import { useState } from "react";
import { DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatImportPanel({ preview, onPreview, onImport, isBusy }) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col rounded-2xl border border-border/70 bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
        <DownloadCloud className="h-4 w-4 text-rani" /> Paste chat to import
      </div>

      <label className="sr-only" htmlFor="bulkText">
        Chat log
      </label>
      <textarea
        id="bulkText"
        className="min-h-[10rem] w-full flex-1 rounded-xl border-[1.5px] border-dashed border-input bg-surface-elevated p-3 text-sm focus-visible:border-ring focus-visible:outline-none"
        placeholder="Paste your cash balance chat here…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="mt-3 flex gap-2">
        <Button variant="outline" onClick={() => onPreview(text)} disabled={!text || isBusy}>
          Preview
        </Button>
        <Button
          onClick={() => onImport(() => setText(""))}
          disabled={!preview || isBusy}
        >
          Import
        </Button>
      </div>

      {preview && (
        <div className="mt-3 flex gap-2 text-xs font-semibold">
          <span className="rounded-full bg-secondary px-2.5 py-1">
            {preview.transactions?.length || 0} transactions
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1">
            {preview.snapshots?.length || 0} snapshots
          </span>
        </div>
      )}
    </div>
  );
}
