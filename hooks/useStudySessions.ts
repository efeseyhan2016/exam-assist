"use client";

import { useEffect, useMemo, useState } from "react";

import { readStudySessions, writeStudySessions } from "@/lib/storage";
import { getTodayKey } from "@/lib/time";
import { StudySession, SubjectId } from "@/lib/types";

interface NewStudySessionInput {
  subjectId: SubjectId;
  minutes: number;
  notes?: string;
}

export function useStudySessions() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSessions(readStudySessions());
    setIsReady(true);
  }, []);

  const addSession = ({ subjectId, minutes, notes }: NewStudySessionInput) => {
    const nextSession: StudySession = {
      id: crypto.randomUUID(),
      subjectId,
      minutes,
      createdAt: new Date().toISOString(),
      notes: notes?.trim() ? notes.trim() : undefined,
    };

    setSessions((current) => {
      const next = [nextSession, ...current];
      writeStudySessions(next);
      return next;
    });
  };

  const todayKey = getTodayKey(new Date());

  const sessionsToday = useMemo(
    () =>
      sessions.filter(
        (session) => getTodayKey(new Date(session.createdAt)) === todayKey,
      ),
    [sessions, todayKey],
  );

  const deleteSession = (id: string) => {
    setSessions((current) => {
      const next = current.filter((s) => s.id !== id);
      writeStudySessions(next);
      return next;
    });
  };

  return {
    isReady,
    sessions,
    sessionsToday,
    addSession,
    deleteSession,
  };
}
