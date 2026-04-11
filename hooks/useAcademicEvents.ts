"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getActiveAcademicEvents, refreshAcademicEvent, sortAcademicEvents } from "@/lib/academic-events";
import {
  ACADEMIC_EVENTS_CHANGED_EVENT,
  readAcademicEvents,
  writeAcademicEvents,
} from "@/lib/storage";
import { AcademicEvent } from "@/lib/types";

export function useAcademicEvents() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = sortAcademicEvents(
        readAcademicEvents().map((event) => refreshAcademicEvent(event)),
      );
      setEvents(next);
      setIsReady(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ACADEMIC_EVENTS_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ACADEMIC_EVENTS_CHANGED_EVENT, sync);
    };
  }, []);

  const replaceEvents = useCallback((nextEvents: AcademicEvent[]) => {
    const normalized = sortAcademicEvents(
      nextEvents.map((event) => refreshAcademicEvent(event)),
    );
    writeAcademicEvents(normalized);
    setEvents(normalized);
  }, []);

  const dismissEvent = useCallback(
    (eventId: string) => {
      replaceEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, status: "dismissed" as const } : event,
        ),
      );
    },
    [events, replaceEvents],
  );

  const resolveEvent = useCallback(
    (eventId: string) => {
      replaceEvents(
        events.map((event) =>
          event.id === eventId ? { ...event, status: "resolved" as const } : event,
        ),
      );
    },
    [events, replaceEvents],
  );

  const addEvent = useCallback(
    (nextEvent: AcademicEvent) => {
      replaceEvents([
        ...events.filter((event) => event.id !== nextEvent.id),
        nextEvent,
      ]);
    },
    [events, replaceEvents],
  );

  const activeEvents = useMemo(
    () => getActiveAcademicEvents(events),
    [events],
  );

  return {
    events,
    activeEvents,
    isReady,
    addEvent,
    replaceEvents,
    dismissEvent,
    resolveEvent,
  };
}
