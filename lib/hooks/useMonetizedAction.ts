"use client";

import { useCallback } from "react";

export function useMonetizedAction() {
  return useCallback(<T,>(action: () => T): T => {
    // A download or print must remain available without an ad impression.
    return action();
  }, []);
}
