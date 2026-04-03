"use client";

import { useEffect, useMemo, useState } from "react";

import { studentConstraints } from "@/lib/seed-data";
import { buildRiskEngineSnapshot } from "@/lib/risk";
import { StudySession } from "@/lib/types";

const RISK_RECALCULATION_INTERVAL = 60_000;

export function useRiskEngine(sessions: StudySession[]) {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, RISK_RECALCULATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);

  return useMemo(
    () => buildRiskEngineSnapshot(sessions, new Date(tick), studentConstraints),
    [sessions, tick],
  );
}
