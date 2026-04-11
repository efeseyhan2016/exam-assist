import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRecommendationFingerprint,
  buildRecommendationFeedbackProfile,
  buildResourceRecommendationFeedbackMap,
  buildResourceRecommendationFeedbackProfile,
  buildTopicRecommendationFeedbackProfile,
  logRecommendationShown,
  markRecommendationAccepted,
  markRecommendationConverted,
} from "@/lib/recommendation-events";
import { readRecommendationEvents, writeActiveStorageScope } from "@/lib/storage";

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

function attachWindow(storage: MemoryStorage) {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
}

function detachWindow() {
  delete (globalThis as { window?: unknown }).window;
}

test("recommendation fingerprint stays stable for the same launch draft", () => {
  const fingerprint = buildRecommendationFingerprint({
    subjectId: "ait204",
    source: "brief",
    minutes: 30,
    topic: "Lozan",
    sourceLabel: "AIT için bugün 30 dakikalık blok ayır.",
  });

  assert.equal(
    fingerprint,
    "ait204::brief::30::Lozan::AIT için bugün 30 dakikalık blok ayır.",
  );
});

test("recommendation events can move from shown to accepted to converted", () => {
  const storage = new MemoryStorage();
  attachWindow(storage);
  writeActiveStorageScope("supabase:user-a");

  const shown = logRecommendationShown(
    {
      subjectId: "ait204",
      source: "brief",
      sourceLabel: "AIT için bugün 30 dakikalık blok ayır.",
      topic: "Lozan",
      recommendedMinutes: 30,
    },
    new Date("2026-04-09T09:00:00.000Z"),
  );

  markRecommendationAccepted(shown.id, new Date("2026-04-09T09:01:00.000Z"));
  markRecommendationConverted(
    shown.id,
    "session-1",
    new Date("2026-04-09T09:35:00.000Z"),
  );

  assert.deepEqual(readRecommendationEvents(), [
    {
      id: shown.id,
      subjectId: "ait204",
      source: "brief",
      sourceLabel: "AIT için bugün 30 dakikalık blok ayır.",
      topic: "Lozan",
      recommendedMinutes: 30,
      shownAt: "2026-04-09T09:00:00.000Z",
      acceptedAt: "2026-04-09T09:01:00.000Z",
      convertedAt: "2026-04-09T09:35:00.000Z",
      sessionId: "session-1",
    },
  ]);

  detachWindow();
});

test("recommendation feedback profile detects recent pending intent and stuck conversions", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");
  const events = [
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "brief" as const,
      sourceLabel: "AIT için blok",
      topic: "Lozan",
      recommendedMinutes: 30,
      shownAt: "2026-04-09T08:00:00.000Z",
      acceptedAt: "2026-04-09T08:02:00.000Z",
    },
    {
      id: "rec-2",
      subjectId: "ait204",
      source: "brief" as const,
      sourceLabel: "AIT için blok",
      topic: "Lozan",
      recommendedMinutes: 35,
      shownAt: "2026-04-08T08:00:00.000Z",
      acceptedAt: "2026-04-08T08:05:00.000Z",
      convertedAt: "2026-04-08T08:40:00.000Z",
      sessionId: "session-2",
    },
    {
      id: "rec-3",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Özeti",
      topic: "Lozan",
      recommendedMinutes: 25,
      shownAt: "2026-04-07T08:00:00.000Z",
      acceptedAt: "2026-04-07T08:05:00.000Z",
      convertedAt: "2026-04-07T08:35:00.000Z",
      sessionId: "session-3",
    },
  ];
  const sessions = [
    {
      id: "session-2",
      subjectId: "ait204",
      minutes: 35,
      createdAt: "2026-04-08T08:40:00.000Z",
      reflection: "stuck" as const,
    },
    {
      id: "session-3",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-07T08:35:00.000Z",
      reflection: "stuck" as const,
    },
  ];

  const profile = buildRecommendationFeedbackProfile({
    subjectId: "ait204",
    events,
    sessions,
    now,
  });

  assert.equal(profile.signal, "friction");
  assert.equal(profile.pendingIntentCount, 1);
  assert.equal(profile.stuckConversions, 2);
  assert.equal(profile.blockMinutesAdjustment, -10);
  assert.ok(profile.guidanceReason);
});

test("resource recommendation feedback profile rewards exact resources that converted well", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");
  const events = [
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Özeti",
      recommendedMinutes: 25,
      shownAt: "2026-04-08T08:00:00.000Z",
      acceptedAt: "2026-04-08T08:05:00.000Z",
      convertedAt: "2026-04-08T08:30:00.000Z",
      sessionId: "session-1",
    },
    {
      id: "rec-2",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Özeti",
      recommendedMinutes: 25,
      shownAt: "2026-04-07T08:00:00.000Z",
      acceptedAt: "2026-04-07T08:05:00.000Z",
      convertedAt: "2026-04-07T08:30:00.000Z",
      sessionId: "session-2",
    },
  ];
  const sessions = [
    {
      id: "session-1",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-08T08:30:00.000Z",
      reflection: "good" as const,
    },
    {
      id: "session-2",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-07T08:30:00.000Z",
      reflection: "good" as const,
    },
  ];

  const profile = buildResourceRecommendationFeedbackProfile({
    subjectId: "ait204",
    resourceLabel: "Lozan Özeti",
    events,
    sessions,
    now,
  });

  assert.equal(profile.signal, "positive");
  assert.equal(profile.goodConversions, 2);
  assert.ok(profile.scoreAdjustment > 1);
  assert.ok(profile.guidanceReason);
});

test("resource recommendation feedback map stays resource-specific", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");
  const events = [
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Özeti",
      recommendedMinutes: 25,
      shownAt: "2026-04-08T08:00:00.000Z",
      acceptedAt: "2026-04-08T08:05:00.000Z",
      convertedAt: "2026-04-08T08:30:00.000Z",
      sessionId: "session-1",
    },
  ];
  const sessions = [
    {
      id: "session-1",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-08T08:30:00.000Z",
      reflection: "good" as const,
    },
  ];

  const feedbackById = buildResourceRecommendationFeedbackMap({
    subjectId: "ait204",
    resources: [
      { id: "lozan", title: "Lozan Özeti" },
      { id: "inkilap", title: "İnkılap Slaytları" },
    ],
    events,
    sessions,
    now,
  });

  assert.equal(feedbackById.get("lozan")?.signal, "positive");
  assert.equal(feedbackById.get("inkilap")?.signal, "neutral");
});

test("topic recommendation feedback profile can reward related resources even when the title differs", () => {
  const now = new Date("2026-04-09T12:00:00.000Z");
  const events = [
    {
      id: "rec-1",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Ders Özeti",
      topic: "Lozan Barış Konferansı",
      recommendedMinutes: 25,
      shownAt: "2026-04-08T08:00:00.000Z",
      acceptedAt: "2026-04-08T08:05:00.000Z",
      convertedAt: "2026-04-08T08:30:00.000Z",
      sessionId: "session-1",
    },
    {
      id: "rec-2",
      subjectId: "ait204",
      source: "resource" as const,
      sourceLabel: "Lozan Ders Özeti",
      topic: "Lozan Barış Konferansı",
      recommendedMinutes: 25,
      shownAt: "2026-04-07T08:00:00.000Z",
      acceptedAt: "2026-04-07T08:05:00.000Z",
      convertedAt: "2026-04-07T08:30:00.000Z",
      sessionId: "session-2",
    },
  ];
  const sessions = [
    {
      id: "session-1",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-08T08:30:00.000Z",
      reflection: "good" as const,
    },
    {
      id: "session-2",
      subjectId: "ait204",
      minutes: 25,
      createdAt: "2026-04-07T08:30:00.000Z",
      reflection: "good" as const,
    },
  ];

  const profile = buildTopicRecommendationFeedbackProfile({
    subjectId: "ait204",
    resourceTopics: ["Lozan Barış Konferansı", "Barış Antlaşması"],
    events,
    sessions,
    now,
  });

  assert.equal(profile.signal, "positive");
  assert.ok(profile.scoreAdjustment > 0.5);
  assert.ok(profile.guidanceReason);
});
