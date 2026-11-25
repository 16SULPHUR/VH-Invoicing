import { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import { useToast } from "@/hooks/use-toast";
import { formatDateDDMMMYYYY } from "@/utils/date";
import { Chips } from "@/features/counter/components/Chips";
import { StatusPill, TokenPill } from "@/features/counter/components/Bits";
import { SetupNotice } from "@/features/counter/components/SetupNotice";
import { useSaveTool, useShopToolsSetup, useToolRecords } from "@/features/counter/hooks/useShopTools";
import { useProducts, useSuppliers } from "../hooks/useInventory";
import { CountSession } from "./CountSession";
import { SCOPES } from "./countMath";

const STATUS = {
  counting: { label: "Counting", tone: "marigold" },
  applied: { label: "Applied", tone: "leaf" },
  closed: { label: "Closed", tone: "neutral" },
};

function StartCount({ products, suppliers, onStarted }) {
  const { toast } = useToast();
  const save = useSaveTool("stock_counts");
  const [scope, setScope] = useState("supplier");
  const [supplier, setSupplier] = useState("");
  const negative = products.filter((product) => (Number(product.quantity) || 0) < 0).length;

  const start = (chosen = scope) =>
    save.mutate(
      { record: null, row: { scope: chosen, supplier: chosen === "supplier" ? supplier : null } },
      {
        onSuccess: (saved) => {
          toast({ title: `Count ${saved.token} started` });
          onStarted(saved);
        },
      }
    );

  return (
    <section className="space-y-3 rounded-2xl bg-surface p-4 shadow-[0_1px_0_hsl(var(--border))]">
      <p className="font-display text-lg font-bold">Start a count</p>
      <Chips label="What to count" value={scope} onChange={setScope} options={SCOPES.map((item) => ({ ...item, count: item.value === "negative" ? negative : 0, alert: true }))} />
      {scope === "supplier" && (
        <select
          aria-label="Supplier"
          className="h-10 w-full rounded-xl border-[1.5px] border-border bg-surface-elevated px-3 text-sm sm:max-w-xs"
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
        >
          <option value="">Choose a supplier…</option>
          {suppliers.map((item) => (
            <option key={item.id} value={String(item.id)}>
              {item.name} ({products.filter((product) => String(product.supplier ?? "") === String(item.id)).length})
            </option>
          ))}
        </select>
      )}
      <p className="text-sm text-muted-foreground">
        {scope === "all"
          ? "Scan every piece in the shop. Products you never scan are listed as not found, for you to decide."
          : scope === "supplier"
            ? "Scan one supplier's pieces. Anything of theirs you don't scan is set to 0 when you apply, unless you untick it."
            : `${negative} products show less than zero in stock. Count just these and apply to fix them.`}
      </p>
      <Button className="press block-shadow" disabled={save.isPending || (scope === "supplier" && !supplier)} onClick={() => start()}>
        Start counting
      </Button>
    </section>
  );
}

/** Count stock with phones, review what differs, then set the quantities (logged per count). */
export default function StockCountTab() {
  const setup = useShopToolsSetup();
  const counts = useToolRecords("stock_counts", setup.ready);
  const products = useProducts();
  const suppliers = useSuppliers();
  const [openId, setOpenId] = useState(null);

  const open = openId ? counts.data.find((item) => item.id === openId) : null;
  const running = useMemo(() => counts.data.filter((item) => item.status === "counting"), [counts.data]);
  const negative = products.data.filter((product) => (Number(product.quantity) || 0) < 0).length;
  const supplierName = (id) => suppliers.data.find((item) => String(item.id) === String(id))?.name ?? "Supplier";
  const scopeLabel = (count) => (count.scope === "supplier" ? supplierName(count.supplier) : SCOPES.find(({ value }) => value === count.scope)?.label);

  if (!setup.ready) return <SetupNotice setup={setup} what="Stock counts" />;
  if (open) return <CountSession count={open} products={products.data} suppliers={suppliers.data} onBack={() => setOpenId(null)} />;

  return (
    <div className="space-y-4">
      {negative > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <p>
            <b>{negative} products show negative stock.</b> Start a count of &quot;Negative stock&quot; to set them to what is really on the shelf.
          </p>
        </div>
      )}

      {running.length > 0 && (
        <section className="space-y-2">
          <p className="eyebrow">Counting now</p>
          {running.map((count) => (
            <button
              key={count.id}
              type="button"
              onClick={() => setOpenId(count.id)}
              className="press flex w-full items-center gap-3 rounded-2xl bg-indigo p-3 text-left text-white"
            >
              <TokenPill token={count.token} className="bg-white/15" />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{scopeLabel(count)}</span>
                <span className="block text-xs text-indigo-foreground">Started {formatDateDDMMMYYYY(count.created_at)} · tap to keep scanning</span>
              </span>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ))}
        </section>
      )}

      <StartCount products={products.data} suppliers={suppliers.data} onStarted={(saved) => setOpenId(saved.id)} />

      <section className="space-y-2">
        <p className="eyebrow">Past counts</p>
        {counts.isLoading ? (
          <PageLoader label="Loading counts…" />
        ) : counts.data.filter((item) => item.status !== "counting").length === 0 ? (
          <EmptyState icon={ClipboardList} title="No counts yet" description="Applied counts are kept here with every quantity they changed." />
        ) : (
          <ul className="space-y-2">
            {counts.data
              .filter((item) => item.status !== "counting")
              .map((count) => (
                <li key={count.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(count.id)}
                    className="press flex w-full items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-3 text-left shadow-[0_1px_0_hsl(var(--border))] hover:ring-2 hover:ring-marigold"
                  >
                    <TokenPill token={count.token} className="min-w-[3.5rem] justify-center py-2" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{scopeLabel(count)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatDateDDMMMYYYY(count.applied_at ?? count.updated_at)}
                        {count.status === "applied" && ` · ${(count.result ?? []).length} products changed`}
                      </span>
                    </span>
                    <StatusPill tone={STATUS[count.status]?.tone}>{STATUS[count.status]?.label}</StatusPill>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
