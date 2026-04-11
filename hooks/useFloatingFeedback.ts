"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FloatingFeedbackToastProps,
} from "@/components/ui/floating-feedback-toast";

export type FloatingFeedbackState = FloatingFeedbackToastProps;

type ShowFloatingFeedbackInput = Omit<FloatingFeedbackState, "id">;

function createFeedbackId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `feedback-${Date.now()}`;
}

export function useFloatingFeedback(defaultDurationMs = 2600) {
  const [feedback, setFeedback] = useState<FloatingFeedbackState | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => {
      setFeedback((current) => (current?.id === feedback.id ? null : current));
    }, feedback.countdownMs ?? defaultDurationMs);

    return () => window.clearTimeout(timer);
  }, [defaultDurationMs, feedback]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const showFeedback = useCallback((input: ShowFloatingFeedbackInput) => {
    setFeedback({
      id: createFeedbackId(),
      ...input,
      countdownMs: input.countdownMs ?? defaultDurationMs,
    });
  }, [defaultDurationMs]);

  return {
    feedback,
    showFeedback,
    clearFeedback,
  };
}
