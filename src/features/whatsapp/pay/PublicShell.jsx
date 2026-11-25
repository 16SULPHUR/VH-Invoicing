import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { BUSINESS } from "@/config/business";

export function Shell({ shopName, children }) {
  const [first, ...rest] = (shopName || BUSINESS.displayName).split(" ");
  return (
    <div className="min-h-dvh bg-background">
      <header className="motif-overlay relative bg-indigo px-5 pb-6 pt-7 text-white">
        <p className="relative mx-auto max-w-md font-display text-[28px] font-extrabold leading-[0.95] tracking-tight">
          {first}
          {rest.length > 0 && <span className="block text-marigold">{rest.join(" ")}</span>}
        </p>
        <div className="motif-band absolute inset-x-0 -bottom-2.5 h-2.5" aria-hidden />
      </header>
      <main className="mx-auto max-w-md space-y-4 px-4 pb-10 pt-8">{children}</main>
    </div>
  );
}

export function Notice({ title, children }) {
  return (
    <div className="rounded-2xl bg-surface p-5 text-center shadow-[0_1px_0_hsl(var(--border))]">
      <h1 className="text-2xl font-extrabold">{title}</h1>
      {children && <p className="mt-2 text-sm text-muted-foreground">{children}</p>}
    </div>
  );
}

export function CopyUpiId({ upiId }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard?.writeText(upiId).then(
          () => setCopied(true),
          () => setCopied(false)
        )
      }
      className="press inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 font-mono text-xs font-semibold"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {upiId}
    </button>
  );
}
