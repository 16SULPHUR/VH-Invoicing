import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { supplierBooksService } from "@/services/supplierBooksService";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useSuppliers } from "@/features/inventory/hooks/useInventory";
import { describeBill } from "../lib/billMath";

const EMPTY = { bills: [], payments: [] };

export function useSupplierBooks() {
  const setup = useQuery({
    queryKey: [...queryKeys.suppliers.books, "ready"],
    queryFn: () => supplierBooksService.isReady(),
    retry: false,
    staleTime: 10 * 60_000,
  });
  const ready = setup.data === true;

  const books = useQuery({
    queryKey: queryKeys.suppliers.books,
    queryFn: () => supplierBooksService.load(),
    enabled: ready,
  });
  useQueryErrorToast(books.error, "Couldn't load supplier bills");

  const suppliers = useSuppliers();
  const { bills, payments } = books.data ?? EMPTY;

  const described = useMemo(() => bills.map((bill) => describeBill(bill, payments)), [bills, payments]);
  const supplierById = useMemo(
    () => new Map((suppliers.data ?? []).map((supplier) => [String(supplier.id), supplier])),
    [suppliers.data]
  );

  return {
    ready,
    checking: setup.isLoading,
    setupError: setup.error,
    isLoading: books.isLoading || suppliers.isLoading,
    bills: described,
    payments,
    suppliers: suppliers.data ?? [],
    supplierById,
    refetch: () => Promise.all([setup.refetch(), books.refetch()]),
  };
}

export function useSupplierBookMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.books });
  const onError = (title) => (error) => toast({ title, description: error.message, variant: "destructive" });

  return {
    saveBill: useMutation({
      mutationFn: (bill) => supplierBooksService.saveBill(bill),
      onSuccess: () => {
        refresh();
        toast({ title: "Bill saved" });
      },
      onError: onError("Couldn't save the bill"),
    }),
    deleteBill: useMutation({
      mutationFn: (id) => supplierBooksService.deleteBill(id),
      onSuccess: () => {
        refresh();
        toast({ title: "Bill removed" });
      },
      onError: onError("Couldn't remove the bill"),
    }),
    addPayments: useMutation({
      mutationFn: (rows) => supplierBooksService.addPayments(rows),
      onSuccess: () => {
        refresh();
        toast({ title: "Saved" });
      },
      onError: onError("Couldn't save"),
    }),
    deletePayment: useMutation({
      mutationFn: (id) => supplierBooksService.deletePayment(id),
      onSuccess: refresh,
      onError: onError("Couldn't remove"),
    }),
    markStockReceived: useMutation({
      mutationFn: (id) => supplierBooksService.markStockReceived(id),
      onSuccess: refresh,
      onError: onError("Couldn't update the bill"),
    }),
  };
}
