import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during server render and hydration, true afterwards. For UI that is random per visit. */
export function useIsClient() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
