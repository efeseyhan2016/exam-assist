"use client";

import { useCallback, useEffect, useState } from "react";

import { readStudyNotes, writeStudyNotes } from "@/lib/storage";
import { StudyNote, SubjectId } from "@/lib/types";

interface NewNoteInput {
  subjectId: SubjectId;
  content: string;
  sessionId?: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setNotes(readStudyNotes());
    setIsReady(true);
  }, []);

  const commitNotes = useCallback((updater: (current: StudyNote[]) => StudyNote[]) => {
    setNotes((current) => {
      const next = updater(current);
      writeStudyNotes(next);
      return next;
    });
  }, []);

  const addNote = useCallback(
    ({ subjectId, content, sessionId }: NewNoteInput) => {
      const now = new Date().toISOString();
      const note: StudyNote = {
        id: crypto.randomUUID(),
        subjectId,
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        pinned: false,
        sessionId,
      };
      commitNotes((current) => [note, ...current]);
      return note;
    },
    [commitNotes],
  );

  const updateNote = useCallback(
    (id: string, content: string) => {
      commitNotes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, content: content.trim(), updatedAt: new Date().toISOString() }
            : n,
        ),
      );
    },
    [commitNotes],
  );

  const togglePin = useCallback(
    (id: string) => {
      commitNotes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() }
            : n,
        ),
      );
    },
    [commitNotes],
  );

  const deleteNote = useCallback(
    (id: string) => {
      commitNotes((current) => current.filter((n) => n.id !== id));
    },
    [commitNotes],
  );

  /** Notes for a specific subject, pinned first then newest first */
  const notesForSubject = useCallback(
    (subjectId: SubjectId): StudyNote[] =>
      notes
        .filter((n) => n.subjectId === subjectId)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [notes],
  );

  return {
    notes,
    isReady,
    addNote,
    updateNote,
    togglePin,
    deleteNote,
    notesForSubject,
  };
}
