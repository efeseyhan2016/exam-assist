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

  /**
   * Number of consecutive calendar days (ending today or yesterday) on which
   * at least one study session was logged.
   */
  const studyStreak = useMemo(() => {
    if (sessions.length === 0) return 0;

    // Collect all unique day keys that have at least one session
    const daysWithSessions = new Set(
      sessions.map((s) => getTodayKey(new Date(s.createdAt))),
    );

    const today = new Date();
    let streak = 0;
    let cursor = new Date(today);

    // If today has no session yet, allow streak to continue from yesterday
    if (!daysWithSessions.has(getTodayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (daysWithSessions.has(getTodayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [sessions]);

  return {
    isReady,
    sessions,
    sessionsToday,
    addSession,
    deleteSession,
    studyStreak,
  };
}
