import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { shopToolsService } from "@/services/shopToolsService";
import { newId } from "@/services/whatsappService";
import { useToast } from "@/hooks/use-toast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

/** Scans for one count, shared live between phones (each scan is its own row). */
export function useCountScans(countId, live) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const key = queryKeys.shopTools.scans(countId);
  const query = useQueryWithDefault({
    queryKey: key,
    queryFn: () => shopToolsService.listScans(countId),
    enabled: Boolean(countId),
    refetchInterval: live ? 5000 : false,
  });

  const edit = (update) => queryClient.setQueryData(key, (previous) => update(previous ?? []));

  const add = useMutation({
    mutationFn: (scan) => shopToolsService.addScan(scan),
    onMutate: (scan) => edit((rows) => [scan, ...rows]),
    onError: (error, scan) => {
      edit((rows) => rows.filter((row) => row.id !== scan.id));
      toast({ variant: "destructive", title: "Scan not saved", description: error.message });
    },
  });

  const remove = useMutation({
    mutationFn: (id) => shopToolsService.removeScan(id),
    onMutate: (id) => edit((rows) => rows.filter((row) => row.id !== id)),
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: key });
      toast({ variant: "destructive", title: "Couldn't undo", description: error.message });
    },
  });

  return {
    scans: query.data,
    isLoading: query.isLoading,
    add: ({ code, product_id = null, quantity = 1 }) =>
      add.mutate({ id: newId(), count_id: countId, code, product_id, quantity, created_at: new Date().toISOString() }),
    remove: (id) => remove.mutate(id),
  };
}
