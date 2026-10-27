import { X } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

/** Full-height side sheet (full screen on phones) with a pinned footer for the main actions. */
export function ToolSheet({ open, onClose, title, description, badge, children, footer }) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-l-0 p-0 sm:max-w-lg [&>button:first-child]:hidden"
      >
        <header className="motif-overlay relative shrink-0 bg-indigo px-5 pb-4 pt-4 text-white">
          <div className="relative flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-white">
                <span className="truncate">{title}</span>
                {badge}
              </SheetTitle>
              <SheetDescription className="text-indigo-foreground">{description}</SheetDescription>
            </div>
            <SheetClose className="press -mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10">
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-surface px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5">
            {footer}
          </footer>
        )}
      </SheetContent>
    </Sheet>
  );
}
