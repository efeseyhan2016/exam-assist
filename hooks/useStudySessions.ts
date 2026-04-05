"use client";

import { useEffect, useMemo, useState } from "react";

import { readStudySessions, writeStudySessions } from "@/lib/storage";
import { getTodayKeyInTimeZone } from "@/lib/time";
import { StudySession, StudySessionReflection, SubjectId } from "@/lib/types";

interface NewStudySessionInput {
  subjectId: SubjectId;
  minutes: number;
  notes?: string;
  topic?: string;
  reflection?: StudySessionReflection;
}

export function useStudySessions(timeZone?: string) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSessions(readStudySessions());
    setIsReady(true);
  }, []);

  const addSession = ({ subjectId, minutes, notes, topic, reflection }: NewStudySessionInput) => {
    const nextSession: StudySession = {
      id: crypto.randomUUID(),
      subjectId,
      minutes,
      createdAt: new Date().toISOString(),
      notes: notes?.trim() ? notes.trim() : undefined,
      topic: topic?.trim() ? topic.trim() : undefined,
      reflection,
    };

    setSessions((current) => {
      const next = [nextSession, ...current];
      writeStudySessions(next);
      return next;
    });
  };

  const todayKey = getTodayKeyInTimeZone(new Date(), timeZone);

  const sessionsToday = useMemo(
    () =>
      sessions.filter(
        (session) => getTodayKeyInTimeZone(new Date(session.createdAt), timeZone) === todayKey,
      ),
    [sessions, timeZone, todayKey],
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
      sessions.map((s) => getTodayKeyInTimeZone(new Date(s.createdAt), timeZone)),
    );

    const today = new Date();
    let streak = 0;
    let cursor = new Date(today);

    // If today has no session yet, allow streak to continue from yesterday
    if (!daysWithSessions.has(getTodayKeyInTimeZone(cursor, timeZone))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (daysWithSessions.has(getTodayKeyInTimeZone(cursor, timeZone))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [sessions, timeZone]);

  return {
    isReady,
    sessions,
    sessionsToday,
    addSession,
    deleteSession,
    studyStreak,
  };
}
