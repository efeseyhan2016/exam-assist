"use client";

import { useCallback, useEffect, useState } from "react";

import { createGradeReleaseAcademicEvent } from "@/lib/academic-events";
import {
  readExamOutcomes,
  upsertAcademicEvent,
  writeExamOutcomes,
} from "@/lib/storage";
import { ExamOutcome, SubjectId } from "@/lib/types";

interface SaveExamOutcomeInput {
  examId: string;
  subjectId: SubjectId;
  score?: number;
  notes?: string;
  subjectTitle?: string;
  shortLabel?: string;
}

export function useExamOutcomes() {
  const [outcomes, setOutcomes] = useState<ExamOutcome[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setOutcomes(readExamOutcomes());
    setIsReady(true);
  }, []);

  const saveOutcome = useCallback((input: SaveExamOutcomeInput) => {
    const now = new Date().toISOString();
    let savedOutcome: ExamOutcome | null = null;

    setOutcomes((current) => {
      const existing = current.find((outcome) => outcome.examId === input.examId);
      const nextOutcome: ExamOutcome = {
        id: existing?.id ?? crypto.randomUUID(),
        examId: input.examId,
        subjectId: input.subjectId,
        score: input.score,
        notes: input.notes?.trim() ? input.notes.trim() : undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      savedOutcome = nextOutcome;

      const next = existing
        ? current.map((outcome) =>
            outcome.examId === input.examId ? nextOutcome : outcome,
          )
        : [nextOutcome, ...current];

      writeExamOutcomes(next);
      return next;
    });

    if (savedOutcome) {
      upsertAcademicEvent(
        createGradeReleaseAcademicEvent(savedOutcome, {
          subjectTitle: input.subjectTitle,
          shortLabel: input.shortLabel,
        }),
      );
    }

    return savedOutcome;
  }, []);

  return {
    outcomes,
    isReady,
    saveOutcome,
  };
}
