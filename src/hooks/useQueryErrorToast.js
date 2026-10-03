import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/** Surfaces a failed load instead of silently rendering empty data. */
export function useQueryErrorToast(error, title) {
  const { toast } = useToast();

  useEffect(() => {
    if (error) toast({ title, description: error.message, variant: "destructive" });
  }, [error, title, toast]);
}
