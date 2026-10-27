import { useState } from "react";
import { Download, Plus, Share, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ICON_STROKE } from "@/config/navigation";
import { BUSINESS } from "@/config/business";
import { useInstallPrompt } from "./useInstallPrompt";

const BANNER_KEY = "vh-install-banner-hidden";

function readHidden() {
  try {
    return localStorage.getItem(BANNER_KEY) === "1";
  } catch {
    return false;
  }
}

// Safari on iPhone has no install API, so the two taps have to be shown.
function IosSteps({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-xl font-extrabold">
            Add to Home Screen
          </SheetTitle>
        </SheetHeader>
        <ol className="mt-4 grid gap-3 text-[15px]">
          <li className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo text-white">
              <Share size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </span>
            Tap <b>Share</b> in Safari&apos;s toolbar
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo text-white">
              <Plus size={18} strokeWidth={ICON_STROKE} aria-hidden />
            </span>
            Choose <b>Add to Home Screen</b>, then <b>Add</b>
          </li>
        </ol>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Installs the app in one tap where the browser allows it (Chrome, Edge, Samsung Internet),
 * and shows the Share steps on iPhone. Renders nothing once installed.
 */
export function InstallButton({ variant = "rail", className = "" }) {
  const { state, install } = useInstallPrompt();
  const [iosOpen, setIosOpen] = useState(false);
  const [hidden, setHidden] = useState(readHidden);

  if (state === "installed" || state === "unavailable") return null;
  if (variant === "banner" && hidden) return null;

  const onClick = () => (state === "ios" ? setIosOpen(true) : install());
  const steps = <IosSteps open={iosOpen} onOpenChange={setIosOpen} />;

  if (variant === "banner") {
    const dismiss = () => {
      setHidden(true);
      try {
        localStorage.setItem(BANNER_KEY, "1");
      } catch {
        // Private mode: it just shows again next time.
      }
    };
    return (
      <div
        className={`motif-overlay flex items-center gap-3 bg-indigo px-4 py-2.5 text-white md:hidden ${className}`}
      >
        <img src="/android-chrome-192x192.png" alt="" className="h-9 w-9 rounded-xl" />
        <p className="min-w-0 flex-1 text-[13px] leading-tight text-indigo-foreground">
          <b className="block text-[14px] text-white">Install {BUSINESS.displayName}</b>
          Opens full screen, works offline
        </p>
        <button
          type="button"
          onClick={onClick}
          className="press rounded-full bg-marigold px-4 py-2 text-[13px] font-extrabold text-marigold-foreground"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide"
          className="press -mr-1 p-1 text-indigo-foreground"
        >
          <X size={18} strokeWidth={ICON_STROKE} aria-hidden />
        </button>
        {steps}
      </div>
    );
  }

  const styles = {
    rail: "flex items-center gap-3 rounded-full bg-marigold px-3.5 py-2.5 text-[14px] font-extrabold text-marigold-foreground hover:brightness-105",
    sheet:
      "flex items-center gap-3 rounded-2xl bg-marigold/15 px-4 py-3 text-[15px] font-bold hover:bg-marigold/25",
    login:
      "flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-marigold px-4 text-sm font-bold hover:bg-marigold/10",
  };

  return (
    <>
      <button type="button" onClick={onClick} className={`press ${styles[variant]} ${className}`}>
        <Download size={variant === "sheet" ? 19 : 18} strokeWidth={ICON_STROKE} aria-hidden />
        {variant === "login" ? "Install the app on this device" : "Install app"}
      </button>
      {steps}
    </>
  );
}
