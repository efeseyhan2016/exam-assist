"use client";

import { useEffect, useState } from "react";

import {
  PlanningRuntimeInputs,
  readPlanningRuntimeInputs,
} from "@/lib/planning-runtime";

export function usePlanningRuntime(refreshKey = 0) {
  const [runtime, setRuntime] = useState<PlanningRuntimeInputs | null>(null);

  useEffect(() => {
    const sync = () => {
      setRuntime(readPlanningRuntimeInputs());
    };

    sync();
    window.addEventListener("storage", sync);

    return () => window.removeEventListener("storage", sync);
  }, [refreshKey]);

  return {
    isReady: runtime !== null,
    runtime: runtime ?? readPlanningRuntimeInputs(),
  };
}
