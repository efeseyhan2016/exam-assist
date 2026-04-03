"use client";

import { useEffect, useMemo, useState } from "react";

import { buildRiskEngineSnapshot } from "@/lib/risk";
import { Exam, StudySession, SubjectSeed, StudentConstraints } from "@/lib/types";

const RISK_RECALCULATION_INTERVAL = 60_000;

export function useRiskEngine(
  sessions: StudySession[],
  input: {
    exams: Exam[];
    subjectSeeds: SubjectSeed[];
    constraints: StudentConstraints;
  },
) {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTick(Date.now());
    }, RISK_RECALCULATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, []);

  return useMemo(
    () =>
      buildRiskEngineSnapshot(sessions, new Date(tick), input.constraints, {
        exams: input.exams,
        subjectSeeds: input.subjectSeeds,
      }),
    [input.constraints, input.exams, input.subjectSeeds, sessions, tick],
  );
}
