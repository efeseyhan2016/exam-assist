"use client";

import { useEffect, useMemo, useState } from "react";

import { getCountdownParts } from "@/lib/time";
import { Exam } from "@/lib/types";

export function useExamCountdown(exams: Exam[]) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => window.clearInterval(interval);
  }, []);

  const currentDate = useMemo(() => new Date(now), [now]);

  const timeline = useMemo(
    () =>
      exams
        .map((exam) => {
          const scheduledAt = new Date(exam.scheduledAt);
          return {
            ...exam,
            scheduledAtDate: scheduledAt,
            countdown: getCountdownParts(scheduledAt, currentDate),
          };
        })
        .sort(
          (left, right) =>
            left.scheduledAtDate.getTime() - right.scheduledAtDate.getTime(),
        ),
    [currentDate, exams],
  );

  const nextExam =
    timeline.find((exam) => exam.scheduledAtDate.getTime() > now) ?? null;

  return {
    now: currentDate,
    nextExam,
    timeline,
  };
}
