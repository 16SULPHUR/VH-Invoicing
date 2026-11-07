import { useCallback, useMemo, useState } from "react";

const LIMIT = 150;
const COALESCE_MS = 1200;

/**
 * Undo/redo for the design being edited. Transient changes (mid-drag) update the design
 * without history until commit(); changes sharing a coalesce key within a moment (typing,
 * nudging) become one step.
 */
export function useDesignHistory(initial) {
  const [state, setState] = useState(() => ({ past: [], present: initial, future: [], anchor: null, key: null, at: 0 }));

  const set = useCallback((updater, { transient = false, coalesce = null } = {}) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current.present) : updater;
      if (next === current.present) return current;
      if (transient) return { ...current, present: next, anchor: current.anchor ?? current.present };
      const now = Date.now();
      if (coalesce && coalesce === current.key && now - current.at < COALESCE_MS) {
        return { ...current, present: next, at: now };
      }
      return {
        past: [...current.past, current.anchor ?? current.present].slice(-LIMIT),
        present: next,
        future: [],
        anchor: null,
        key: coalesce,
        at: now,
      };
    });
  }, []);

  const commit = useCallback(() => {
    setState((current) =>
      current.anchor && current.anchor !== current.present
        ? { past: [...current.past, current.anchor].slice(-LIMIT), present: current.present, future: [], anchor: null, key: null, at: 0 }
        : { ...current, anchor: null }
    );
  }, []);

  const undo = useCallback(() => {
    setState((current) =>
      current.past.length === 0
        ? current
        : { past: current.past.slice(0, -1), present: current.past.at(-1), future: [current.present, ...current.future], anchor: null, key: null, at: 0 }
    );
  }, []);

  const redo = useCallback(() => {
    setState((current) =>
      current.future.length === 0
        ? current
        : { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1), anchor: null, key: null, at: 0 }
    );
  }, []);

  const reset = useCallback((design) => setState({ past: [], present: design, future: [], anchor: null, key: null, at: 0 }), []);

  return useMemo(
    () => ({
      design: state.present,
      isGesture: state.anchor !== null,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      set,
      commit,
      undo,
      redo,
      reset,
    }),
    [state, set, commit, undo, redo, reset]
  );
}
