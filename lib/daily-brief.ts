import { HomeFocusRecommendation } from "@/lib/home-focus";
import { formatMinutesAsHours, formatRelativeDuration } from "@/lib/time";
import { RankedSubjectRisk } from "@/lib/types";

interface UpcomingExamBriefInput {
  title: string;
  shortLabel: string;
  countdown: {
    totalMilliseconds: number;
  };
}

interface DailyBriefInput {
  topRisk: RankedSubjectRisk | null;
  homeFocus: HomeFocusRecommendation | null;
  upcomingExams: UpcomingExamBriefInput[];
  dailyMinutes: number;
  dailyGoalMinutes: number;
}

export interface DailyBrief {
  headline: string;
  body: string;
  chips: Array<{
    label: string;
    value: string;
  }>;
}

export function buildDailyBrief(input: DailyBriefInput): DailyBrief {
  const nextExam =
    input.upcomingExams.find((exam) => exam.countdown.totalMilliseconds > 0) ?? null;
  const remainingGoalMinutes = Math.max(input.dailyGoalMinutes - input.dailyMinutes, 0);

  if (!input.homeFocus || !input.topRisk) {
    return {
      headline: "Bugünün kısa planı birazdan netleşecek.",
      body: "Sınavlar ve dersler hazır olduğunda ilk blok önerisi burada görünür.",
      chips: [],
    };
  }

  const focus = input.homeFocus.subject;
  const baseChips = [
    { label: "İlk blok", value: focus.shortLabel },
    {
      label: "Kalan hedef",
      value:
        input.dailyGoalMinutes > 0
          ? formatMinutesAsHours(remainingGoalMinutes)
          : "Serbest",
    },
  ];

  if (nextExam) {
    baseChips.push({
      label: "En yakın",
      value: `${nextExam.shortLabel} · ${formatRelativeDuration(nextExam.countdown.totalMilliseconds)}`,
    });
  }

  if (input.dailyGoalMinutes > 0 && remainingGoalMinutes === 0) {
    return {
      headline: "Bugünkü hedef kapanmış görünüyor.",
      body: nextExam
        ? `${nextExam.title} yaklaşırken istersen kısa bir tekrar için ${focus.title} açabilirsin.`
        : `${focus.title} ile kısa bir tekrar yapıp günü hafifçe kapatabilirsin.`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "switch") {
    return {
      headline: `${focus.title} ile yön değiştir.`,
      body: `${input.homeFocus.reason} Kalan günlük alanı burada kullanmak daha dengeli olur.`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "continue") {
    return {
      headline: `${focus.title} ile devam et.`,
      body: `${input.homeFocus.reason} Bugünün kalan bloğu burada en iyi karşılığı verir.`,
      chips: baseChips,
    };
  }

  return {
    headline: `${focus.title} ile başla.`,
    body: nextExam
      ? `${nextExam.title} yaklaşırken ilk temiz blok için en iyi giriş burada duruyor.`
      : "İlk bloğu burada açmak günü daha sakin ve net toplar.",
    chips: baseChips,
  };
}
