import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { productService } from "@/services/productService";
import { supplierService } from "@/services/supplierService";
import { useToast } from "@/hooks/use-toast";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.full,
    queryFn: () => productService.list(),
    placeholderData: [],
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers.all,
    queryFn: () => supplierService.list(),
    placeholderData: [],
  });
}

/** Shared wiring for every inventory write: toast on both outcomes, then refetch. */
export function useInventoryMutation({ mutationFn, successMessage, errorMessage, invalidates }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invalidates ?? queryKeys.products.all });
      toast({
        title: "Success",
        description:
          typeof successMessage === "function" ? successMessage(variables) : successMessage,
      });
    },
    onError: (error) =>
      toast({
        variant: "destructive",
        title: "Error",
        description: `${errorMessage}: ${error.message}`,
      }),
  });
}

export const useUpdateProduct = () =>
  useInventoryMutation({
    mutationFn: ({ id, ...changes }) => productService.update(id, changes),
    successMessage: "Product updated successfully.",
    errorMessage: "Failed to update product",
  });

export const useDeleteProduct = () =>
  useInventoryMutation({
    mutationFn: (id) => productService.remove(id),
    successMessage: "Product deleted successfully.",
    errorMessage: "Failed to delete product",
  });

export const useUpdateProductImages = () =>
  useInventoryMutation({
    mutationFn: ({ id, images }) => productService.setImages(id, images),
    successMessage: "Images updated successfully.",
    errorMessage: "Failed to update product images",
  });

export const useUpdateSupplier = () =>
  useInventoryMutation({
    mutationFn: ({ id, ...changes }) => supplierService.update(id, changes),
    successMessage: "Supplier updated successfully.",
    errorMessage: "Failed to update supplier",
    invalidates: queryKeys.suppliers.all,
  });

export const useDeleteSupplier = () =>
  useInventoryMutation({
    mutationFn: (id) => supplierService.remove(id),
    successMessage: "Supplier deleted successfully.",
    errorMessage: "Failed to delete supplier",
    invalidates: queryKeys.suppliers.all,
  });
