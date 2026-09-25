import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { isStale, shopToolsService } from "@/services/shopToolsService";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

/** { ready, missing, isLoading, error }: ready once docs/schema/shop_tools.sql has been run. */
export function useShopToolsSetup() {
  const query = useQuery({
    queryKey: queryKeys.shopTools.setup,
    queryFn: () => shopToolsService.setup(),
    retry: false,
    staleTime: 10 * 60_000,
  });
  return {
    ready: query.data ? query.data.missing.length === 0 : false,
    missing: query.data?.missing ?? [],
    isLoading: query.isLoading,
    error: query.error,
    retry: query.refetch,
  };
}

export function useToolRecords(table, enabled) {
  const query = useQueryWithDefault({
    queryKey: queryKeys.shopTools.records(table),
    queryFn: () => shopToolsService.list(table),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
  useQueryErrorToast(query.error, "Couldn't load");
  return query;
}

/**
 * Saves a record (and its stock changes) with the version it was read at. The cached list
 * is updated from the saved row; product quantities are refetched when stock moved.
 */
export function useSaveTool(table) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ record, row, moves = [], reason }) =>
      shopToolsService.save(table, row, { id: record?.id ?? null, version: record?.version ?? null, moves, reason }),
    onSuccess: (saved, { moves = [] }) => {
      const key = queryKeys.shopTools.records(table);
      // A list that was never loaded must be fetched whole, not seeded with this one row.
      if (queryClient.getQueryData(key) === undefined) queryClient.invalidateQueries({ queryKey: key });
      else
        queryClient.setQueryData(key, (rows) =>
          rows.some((row) => row.id === saved.id) ? rows.map((row) => (row.id === saved.id ? saved : row)) : [saved, ...rows]
        );
      if (moves.some((move) => move.delta)) queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (error) => {
      if (isStale(error)) queryClient.invalidateQueries({ queryKey: queryKeys.shopTools.records(table) });
      toast({
        variant: "destructive",
        title: isStale(error) ? "Changed on another device" : "Couldn't save",
        description: isStale(error) ? "Nothing was changed here. The latest version is loading, please try again." : error.message,
      });
    },
  });
}
