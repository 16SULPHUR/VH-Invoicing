import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import { shopToolsService } from "@/services/shopToolsService";

/**
 * Hands pieces to the till through the shared scan list (the phone scanner's route), so the
 * till's own save path bills them and takes them out of stock. Pieces without a code, and
 * custom work, are listed for typing in by hand.
 */
export function useTillHandoff() {
  const queryClient = useQueryClient();
  const [handoff, setHandoff] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const push = useCallback(
    async (lines) => {
      await shopToolsService.sendToTill(lines);
      queryClient.invalidateQueries({ queryKey: queryKeys.scannedProducts.all });
    },
    [queryClient]
  );

  const start = useCallback(
    async ({ lines, manual = [], ...meta }) => {
      const sendable = lines.filter((line) => line.barcode && line.quantity > 0);
      const byHand = lines.filter((line) => !line.barcode && line.quantity > 0);
      let failed = null;
      try {
        await push(sendable);
      } catch (error) {
        failed = error.message;
      }
      setHandoff({ ...meta, sent: sendable, manual: [...byHand, ...manual], failed });
    },
    [push]
  );

  const retry = useCallback(async () => {
    if (!handoff) return;
    setRetrying(true);
    try {
      await push(handoff.sent);
      setHandoff({ ...handoff, failed: null });
    } catch (error) {
      setHandoff({ ...handoff, failed: error.message });
    } finally {
      setRetrying(false);
    }
  }, [handoff, push]);

  return { handoff, start, retry, retrying, close: () => setHandoff(null) };
}
