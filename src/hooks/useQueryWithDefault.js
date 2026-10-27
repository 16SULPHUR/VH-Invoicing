import { useQuery } from "@tanstack/react-query";

export const EMPTY_LIST = Object.freeze([]);

/**
 * placeholderData still lets the first fetch run (initialData would count as fresh),
 * but it is dropped on error, so fall back explicitly.
 */
export function useQueryWithDefault(options, fallback = EMPTY_LIST) {
  const result = useQuery({ ...options, placeholderData: fallback });
  return result.data === undefined ? { ...result, data: fallback } : result;
}
