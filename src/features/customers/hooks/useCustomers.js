import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";
import { useQueryErrorToast } from "@/hooks/useQueryErrorToast";
import { useQueryWithDefault } from "@/hooks/useQueryWithDefault";

export function useCustomers() {
  const query = useQueryWithDefault({
    queryKey: queryKeys.customers.all,
    queryFn: () => customerService.list(),
  });
  useQueryErrorToast(query.error, "Failed to load customers");
  return query;
}

/** Wraps a customer write so every caller gets the same toasts and cache refresh. */
function useCustomerMutation({ mutationFn, successMessage, errorMessage }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast({ title: "Success", description: successMessage });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `${errorMessage}: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export const useAddCustomer = () =>
  useCustomerMutation({
    mutationFn: (customer) => customerService.create(customer),
    successMessage: "Customer added successfully.",
    errorMessage: "Failed to add customer",
  });

export const useUpdateCustomer = () =>
  useCustomerMutation({
    mutationFn: ({ id, name, address, phone }) =>
      customerService.update(id, { name, address, phone }),
    successMessage: "Customer updated successfully.",
    errorMessage: "Failed to update customer",
  });

export const useDeleteCustomer = () =>
  useCustomerMutation({
    mutationFn: (id) => customerService.remove(id),
    successMessage: "Customer deleted.",
    errorMessage: "Failed to delete customer",
  });
