import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "press inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-50";
const tones = {
  leaf: "bg-leaf text-white hover:brightness-110",
  outline: "border-[1.5px] border-border bg-surface text-leaf hover:bg-secondary",
};

/**
 * One tap: opens the customer's WhatsApp chat with `message` and runs `onSend` (log it, mark
 * the job ready). Without a phone number it only runs `onSend`.
 */
export function WhatsAppAction({ message, onSend, children, tone = "leaf", className = "", disabled = false }) {
  if (!message.canSend) {
    return (
      <button type="button" disabled={disabled} onClick={() => onSend(false)} className={cn(base, tones[tone], className)}>
        {children}
      </button>
    );
  }
  return (
    <a
      href={message.href}
      target={message.target}
      rel="noopener noreferrer"
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) return event.preventDefault();
        onSend(true);
      }}
      className={cn(base, tones[tone], "aria-disabled:pointer-events-none aria-disabled:opacity-50", className)}
    >
      <MessageCircle className="h-4 w-4" aria-hidden />
      {children}
    </a>
  );
}
