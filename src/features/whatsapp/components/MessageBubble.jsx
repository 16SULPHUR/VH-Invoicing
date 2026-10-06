import { cn } from "@/lib/utils";
import { formatSegments } from "../lib/templates";

const STYLE = { "*": "font-bold", _: "italic", "~": "line-through" };

/** A message as WhatsApp will show it, with *bold* and _italic_ applied. */
export function MessageBubble({ text, className = "" }) {
  return (
    <div
      className={cn(
        "relative whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-[#e7f6dc] px-3.5 py-2.5 text-[14px] leading-snug text-[#10261a] shadow-[0_1px_0_hsl(var(--border))]",
        className
      )}
    >
      {text ? (
        formatSegments(text).map((segment, index) =>
          segment.style ? (
            <span key={index} className={STYLE[segment.style]}>
              {segment.text}
            </span>
          ) : (
            segment.text
          )
        )
      ) : (
        <span className="text-muted-foreground">Empty message</span>
      )}
    </div>
  );
}
