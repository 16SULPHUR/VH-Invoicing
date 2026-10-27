import { useSearchParams } from "react-router-dom";

/**
 * Keeps a tab selection in the query string so tabs are deep-linkable and the
 * browser's back button steps through them.
 */
export function useTabParam(defaultValue, key = "tab") {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) ?? defaultValue;

  const setValue = (next) => {
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (next === defaultValue) params.delete(key);
        else params.set(key, next);
        return params;
      },
      { replace: true }
    );
  };

  return [value, setValue];
}
