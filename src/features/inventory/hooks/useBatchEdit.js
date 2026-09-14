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

      for (const id of selectedIds) {
        const product = products.find((candidate) => candidate.id === id);
        if (!product) continue;

        const changes = buildBatchUpdate(product, batchEditData);
        if (Object.keys(changes).length > 0) {
          updates.push(productService.update(id, changes));
        }
      }

      await Promise.all(updates);
      return updates.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      setBatchEditData(EMPTY_BATCH_EDIT);
      onDone?.();
      toast({ title: "Success", description: `Updated ${count} product(s).` });
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
