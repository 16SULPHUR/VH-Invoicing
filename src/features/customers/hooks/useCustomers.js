import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";

export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: () => customerService.list(),
    placeholderData: [],
  });
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
    mutationFn: ({ id, ...changes }) => customerService.update(id, changes),
    successMessage: "Customer updated successfully.",
    errorMessage: "Failed to update customer",
  });

export const useDeleteCustomer = () =>
  useCustomerMutation({
    mutationFn: (id) => customerService.remove(id),
    successMessage: "Customer deleted.",
    errorMessage: "Failed to delete customer",
  });
