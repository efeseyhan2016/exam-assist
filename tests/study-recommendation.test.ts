import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPostSessionFeedback,
  buildSessionFeedbackMessage,
  buildStudyLaunchDraft,
  buildStudyRecommendationSentence,
  getRecommendedStudyBlockMinutes,
} from "@/lib/study-recommendation";
import { Exam, SubjectSeed, StudentConstraints, StudySession } from "@/lib/types";

const constraints: StudentConstraints = {
  dailyStudyGoalHours: 5,
  studyDayStartHour: 9,
  standardStudyDayEndHour: 23,
  morningSleepCutoffHour: 2,
  sleepTargetHours: 7,
  wakeBufferMinutes: 80,
};

function makeSubject(id: string, title: string, targetHours = 8): SubjectSeed {
  return {
    id,
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    contentLoad: 3.5,
    difficulty: 3.5,
    practiceNeed: 2.5,
    resourceFriction: 2.5,
    reliefFactor: 0.25,
    targetHours,
    initialStudiedCredit: 0,
    calibration: {
      difficultyRaw: "orta",
      resourceReadinessRaw: "kismen",
      preparednessRaw: "biraz",
    },
  };
}

function makeExam(subjectId: string, title: string, scheduledAt: string): Exam {
  return {
    id: `${subjectId}-exam`,
    subjectId,
    title,
    shortLabel: title.slice(0, 3).toUpperCase(),
    scheduledAt,
  };
}

function makeSession(subjectId: string, minutes: number, reflection?: StudySession["reflection"]): StudySession {
  return {
    id: `${subjectId}-${minutes}`,
    subjectId,
    minutes,
    createdAt: "2026-04-06T10:00:00.000Z",
    reflection,
  };
}

test("study recommendation narrows into a consolidation block near the exam", () => {
  const recommendation = buildStudyRecommendationSentence({
    subjectTitle: "MAN201",
    hoursUntilExam: 36,
    remainingGoalMinutes: 120,
    riskLabel: "High",
    mode: "start",
  });

  assert.equal(recommendation.blockMinutes, 35);
  assert.match(recommendation.sentence, /tek bir toparlama bloğu/i);
});

test("study recommendation uses switch wording when focus moves to a second block", () => {
  const recommendation = buildStudyRecommendationSentence({
    subjectTitle: "Hukuk",
    hoursUntilExam: 120,
    remainingGoalMinutes: 90,
    riskLabel: "Critical",
    mode: "switch",
  });

  assert.equal(recommendation.blockMinutes, 60);
  assert.match(recommendation.sentence, /ikinci bir blok/i);
});

test("study launch draft reuses the same recommended block size for downstream forms", () => {
  const draft = buildStudyLaunchDraft({
    subjectId: "man201",
    subjectTitle: "MAN201",
    hoursUntilExam: 20,
    remainingGoalMinutes: 80,
    riskLabel: "High",
    source: "onboarding",
    sourceLabel: "İlk öneri",
  });

  assert.equal(draft.subjectId, "man201");
  assert.equal(draft.minutes, 30);
  assert.equal(draft.source, "onboarding");
  assert.equal(draft.sourceLabel, "İlk öneri");
});

test("stuck reflection narrows the next recommended block", () => {
  const recommendation = buildStudyRecommendationSentence({
    subjectTitle: "MAN201",
    hoursUntilExam: 90,
    remainingGoalMinutes: 120,
    riskLabel: "Critical",
    mode: "start",
    lastReflection: "stuck",
  });

  assert.equal(recommendation.blockMinutes, 30);
  assert.match(recommendation.sentence, /dar konu bloğu/i);
});

test("session feedback names the next natural focus when priorities shift", () => {
  const message = buildSessionFeedbackMessage({
    subjectTitle: "Ekonomi",
    previousTopTitle: "Ekonomi",
    nextTopTitle: "Hukuk",
  });

  assert.match(message, /Hukuk tarafına kayabilir/i);
});

test("post-session feedback stays conservative and reflection-aware when the same subject remains on top", () => {
  const message = buildPostSessionFeedback({
    subjectTitle: "MAN201",
    previousTopTitle: "MAN201",
    reflection: "stuck",
    sessions: [],
    nextSession: makeSession("man201", 45, "stuck"),
    now: new Date("2026-04-06T10:00:00.000Z"),
    constraints,
    exams: [makeExam("man201", "MAN201 Vize", "2026-04-08T09:00:00.000Z")],
    subjectSeeds: [makeSubject("man201", "MAN201", 8)],
  });

  assert.match(message, /daha dar bir kaynak seçimi/i);
});
