"use client";

import { useEffect, useState } from "react";

import {
  readRecommendationEvents,
  RECOMMENDATION_EVENTS_CHANGED_EVENT,
} from "@/lib/storage";
import { RecommendationEvent } from "@/lib/types";

export function useRecommendationEvents() {
  const [events, setEvents] = useState<RecommendationEvent[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEvents(readRecommendationEvents());
      setIsReady(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(RECOMMENDATION_EVENTS_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(RECOMMENDATION_EVENTS_CHANGED_EVENT, sync);
    };
  }, []);

  return {
    events,
    isReady,
  };
}
