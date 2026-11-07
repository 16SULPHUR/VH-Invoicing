import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";
import { EMPTY_BATCH_EDIT, buildBatchUpdate } from "../batchEdit";

export function useBatchEdit({ products, selectedIds, onDone }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [batchEditData, setBatchEditData] = useState(EMPTY_BATCH_EDIT);

  const apply = useMutation({
    mutationFn: async () => {
      const updates = [];
      const additions = [];

      for (const id of selectedIds) {
        const product = products.find((candidate) => candidate.id === id);
        if (!product) continue;

        const changes = buildBatchUpdate(product, batchEditData);
        if (Object.keys(changes).length > 0) {
          updates.push(productService.update(id, changes));
          if ("quantity" in changes) {
            additions.push({ id, count: changes.quantity - (Number(product.quantity) || 0) });
          }
        }
      }

      await Promise.all(updates);
      return { count: updates.length, additions };
    },
    onSuccess: ({ count, additions }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setBatchEditData(EMPTY_BATCH_EDIT);
      toast({ title: "Success", description: `Updated ${count} product(s).` });
      onDone?.(additions);
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: `Batch update failed: ${error.message}`,
      }),
  });

  const setField = (field, patch) =>
    setBatchEditData((previous) => ({ ...previous, [field]: { ...previous[field], ...patch } }));

  return { batchEditData, setField, apply };
}
