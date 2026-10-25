import { useEffect, useState, type SetStateAction } from "react";
/** Refresh clean forms; keep edited fields tied to the record version they were based on. */
export function useVersionedDraft<T>(initial: T, version: number) {
  const [state, setState] = useState({ value: initial, base: initial, version });
  const dirty = JSON.stringify(state.value) !== JSON.stringify(state.base);
  useEffect(() => {
    if (!dirty && state.version !== version) {
      setState({ value: initial, base: initial, version });
    }
  }, [dirty, initial, state.version, version]);
  return {
    value: state.value,
    expectedVersion: state.version,
    stale: dirty && state.version !== version,
    setValue: (value: SetStateAction<T>) =>
      setState((current) => ({
        ...current,
        value: typeof value === "function" ? (value as (previous: T) => T)(current.value) : value,
      })),
    saved: (nextVersion: number) =>
      setState((current) => ({ value: current.value, base: current.value, version: nextVersion })),
    reset: () => setState({ value: initial, base: initial, version }),
  };
}
