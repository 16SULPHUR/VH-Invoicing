import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { labelDesignService } from "@/services/labelDesignService";
import { useToast } from "@/hooks/use-toast";

export function useLabelDesigns() {
  const query = useQuery({
    queryKey: queryKeys.labelDesigns,
    queryFn: () => labelDesignService.list(),
    placeholderData: () => ({ designs: labelDesignService.cached(), stored: null }),
    staleTime: 60_000,
    retry: false,
  });
  const designs = query.data?.designs ?? [];
  return {
    designs,
    defaultDesign: designs.find((design) => design.is_default) ?? designs[0],
    stored: query.isPlaceholderData ? null : query.data?.stored,
    isLoading: query.isPlaceholderData,
  };
}

function mergeInto(previous, changed, removedId) {
  const byId = new Map((previous?.designs ?? []).map((design) => [design.id, design]));
  changed.forEach((design) => byId.set(design.id, design));
  if (removedId) byId.delete(removedId);
  return {
    stored: previous?.stored ?? null,
    designs: [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Saves one or more whole designs (autosave, rename, default changes). */
export function useSaveDesigns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (changed) => labelDesignService.save(changed),
    onMutate: (changed) =>
      queryClient.setQueryData(queryKeys.labelDesigns, (previous) => mergeInto(previous, changed)),
    onSuccess: (stored) =>
      queryClient.setQueryData(queryKeys.labelDesigns, (previous) => ({ ...previous, stored })),
    onError: (error) => toast({ variant: "destructive", title: "Design not saved", description: error.message }),
  });
}

export function useDeleteDesign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => labelDesignService.remove(id),
    onMutate: (id) => queryClient.setQueryData(queryKeys.labelDesigns, (previous) => mergeInto(previous, [], id)),
    onSuccess: (stored) =>
      queryClient.setQueryData(queryKeys.labelDesigns, (previous) => ({ ...previous, stored })),
  });
}

/** The design a product prints with: the batch choice, its supplier's default, or the shop default. */
export function designFor(product, designs, override) {
  if (override) {
    const chosen = designs.find((design) => design.id === override);
    if (chosen) return chosen;
  }
  const supplierId = product?.supplier == null ? null : String(product.supplier);
  return (
    (supplierId && designs.find((design) => design.default_for.map(String).includes(supplierId))) ||
    designs.find((design) => design.is_default) ||
    designs[0]
  );
}

/** Making one design the default clears it from the others. */
export function withDefault(designs, id) {
  const now = new Date().toISOString();
  return designs
    .filter((design) => design.is_default !== (design.id === id))
    .map((design) => ({ ...design, is_default: design.id === id, updated_at: now }));
}
