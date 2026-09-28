import { useState } from "react";
import { DownloadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatImportPanel({ preview, onPreview, onImport, isBusy }) {
  const [text, setText] = useState("");

  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <DownloadCloud className="h-4 w-4" /> Paste chat to import
      </div>

      <label className="sr-only" htmlFor="bulkText">
        Chat log
      </label>
      <textarea
        id="bulkText"
        className="h-40 w-full rounded border border-border bg-transparent p-2 text-sm"
        placeholder="Paste your cash balance chat here…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={() => onPreview(text)} disabled={!text || isBusy}>
          Preview
        </Button>
        <Button
          onClick={() => onImport(() => setText(""))}
          disabled={!preview || isBusy}
          className="bg-primary hover:bg-primary"
        >
          Import
        </Button>
      </div>

      {preview && (
        <div className="mt-3 text-xs text-muted-foreground">
          <div>Transactions: {preview.transactions?.length || 0}</div>
          <div>Snapshots: {preview.snapshots?.length || 0}</div>
        </div>
      )}
    </div>
  );
}
