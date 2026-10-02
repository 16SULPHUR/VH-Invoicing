import { Check, CheckCheck } from "lucide-react";
import { ICON_STROKE } from "@/config/navigation";
import { formatDateDDMMMYYYY } from "@/utils/date";

function ago(value) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return formatDateDDMMMYYYY(value);
}

/** Like WhatsApp ticks: one when the link is sent, two once the customer has opened it. */
export function SeenTicks({ count, lastSeen, onlySeen = false, className = "" }) {
  if (count === undefined || count === null) return null;
  const seen = Number(count) > 0;
  if (onlySeen && !seen) return null;
  const Icon = seen ? CheckCheck : Check;
  const text = seen
    ? `Opened${count > 1 ? ` ${count}×` : ""}${lastSeen ? ` · ${ago(lastSeen)}` : ""}`
    : "Not opened yet";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        seen ? "text-indigo" : "text-muted-foreground"
      } ${className}`}
    >
      <Icon size={14} strokeWidth={ICON_STROKE} aria-hidden />
      {text}
    </span>
  );
}
