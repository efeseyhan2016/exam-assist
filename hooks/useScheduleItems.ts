"use client";

import { useEffect, useMemo, useState } from "react";

import { createScheduleTaskAcademicEvent } from "@/lib/academic-events";
import {
  readScheduleItems,
  removeAcademicEvent,
  upsertAcademicEvent,
  writeScheduleItems,
} from "@/lib/storage";
import {
  ScheduleItem,
  ScheduleItemKind,
  SubjectCalibrationAnswers,
} from "@/lib/types";

interface NewScheduleItemInput {
  title: string;
  scheduledAt: string;
  kind: ScheduleItemKind;
  notes?: string;
  calibration?: SubjectCalibrationAnswers;
}

function buildShortLabel(title: string) {
  const compact = title.trim();
  if (compact.length <= 10) {
    return compact;
  }

  const initials = compact
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || compact.slice(0, 10);
}

export function useScheduleItems() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(readScheduleItems());
    setIsReady(true);
  }, []);

  const addItem = ({
    title,
    scheduledAt,
    kind,
    notes,
    calibration,
  }: NewScheduleItemInput) => {
    addItems([{ title, scheduledAt, kind, notes, calibration }]);
  };

  const addItems = (inputs: NewScheduleItemInput[]) => {
    const nextItems = inputs
      .map<ScheduleItem>((input) => ({
        id: crypto.randomUUID(),
        title: input.title.trim(),
        shortLabel: buildShortLabel(input.title),
        scheduledAt: input.scheduledAt,
        kind: input.kind,
        source: "manual",
        notes: input.notes?.trim() ? input.notes.trim() : undefined,
        calibration: input.kind === "exam" ? input.calibration : undefined,
      }))
      .filter((item) => item.title && item.scheduledAt);

    if (nextItems.length === 0) {
      return;
    }

    setItems((current) => {
      const next = [...current, ...nextItems].sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      );
      writeScheduleItems(next);
      nextItems.forEach((item) => {
        const event = createScheduleTaskAcademicEvent(item);
        if (event) {
          upsertAcademicEvent(event);
        }
      });
      return next;
    });
  };

  const manualItemsCount = useMemo(
    () => items.filter((item) => item.source === "manual").length,
    [items],
  );

  const deleteItem = (id: string) => {
    setItems((current) => {
      const removed = current.find((item) => item.id === id);
      const next = current.filter((item) => item.id !== id);
      writeScheduleItems(next);
      if (removed && removed.kind !== "exam") {
        removeAcademicEvent(`schedule-item:${removed.id}`);
      }
      return next;
    });
  };

  const restoreItem = (item: ScheduleItem) => {
    setItems((current) => {
      const next = [...current.filter((entry) => entry.id !== item.id), item].sort(
        (left, right) =>
          new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
      );
      writeScheduleItems(next);
      const event = createScheduleTaskAcademicEvent(item);
      if (event) {
        upsertAcademicEvent(event);
      }
      return next;
    });
  };

  return {
    items,
    isReady,
    addItem,
    addItems,
    deleteItem,
    restoreItem,
    manualItemsCount,
  };
}
