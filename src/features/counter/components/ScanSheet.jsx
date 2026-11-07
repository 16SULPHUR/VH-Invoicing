import { useCallback, useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CameraPanel } from "@/features/scanner/components/CameraPanel";
import { useBarcodeCamera } from "@/features/scanner/hooks/useBarcodeCamera";
import { normalizeCode } from "../lib/shopTools";
import { useBeep } from "../hooks/useBeep";

// The camera reports a tag again every second while it stays in view; that is one piece.
const SAME_TAG_MS = 2000;

/** The camera, started as soon as it is on screen. `onCode` returns a line to show under it. */
export function LiveScanner({ onCode, autoStart = true }) {
  const beep = useBeep();
  const [last, setLast] = useState(null);
  const seen = useRef({ code: null, at: 0 });
  const onDetected = useCallback(
    ({ barcode }) => {
      const code = normalizeCode(barcode);
      const now = Date.now();
      const repeat = seen.current.code === code && now - seen.current.at < SAME_TAG_MS;
      seen.current = { code, at: now };
      if (repeat) return;
      const result = onCode(code);
      if (result?.ok !== false) beep();
      setLast(result ?? null);
    },
    [onCode, beep]
  );
  const camera = useBarcodeCamera({ onDetected });
  const { start, stop } = camera;

  useEffect(() => {
    if (!autoStart) return undefined;
    const timer = setTimeout(start, 50);
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [autoStart, start, stop]);

  return (
    <div className="space-y-2">
      <CameraPanel camera={camera} />
      {last && (
        <p
          role="status"
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            last.ok === false ? "bg-destructive/10 text-destructive" : "bg-leaf/10 text-leaf"
          }`}
        >
          {last.message}
        </p>
      )}
    </div>
  );
}

/** Bottom sheet that keeps scanning until Done, handing each code to `onCode`. */
export function ScanSheet({ open, onClose, onCode, title = "Scan tags", description = "Hold each tag in the box, then move it away. Every scan adds one piece." }) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1rem)]">
        <SheetTitle className="font-display text-xl font-extrabold">{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
        <div className="mx-auto mt-3 max-w-xl space-y-3">
          {open && <LiveScanner onCode={onCode} />}
          <Button className="press block-shadow w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
