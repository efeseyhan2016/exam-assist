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
  activeTopic?: string | null;
  primaryResource?: {
    title: string;
    actionLabel: string;
    topics?: string[];
  } | null;
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
      body: "Sınavlar ve dersler hazır olduğunda bugünkü çalışma yaklaşımı burada görünür.",
      chips: [],
    };
  }

  const focus = input.homeFocus.subject;
  const baseChips = [
    { label: "Ana odak", value: focus.shortLabel },
    {
      label: "Kalan alan",
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

  if (input.primaryResource) {
    baseChips.push({
      label: "İlk kaynak",
      value: input.primaryResource.title,
    });
    if (input.primaryResource.topics?.[0]) {
      baseChips.push({
        label: "Konu hattı",
        value: input.primaryResource.topics[0],
      });
    }
  }
  if (input.activeTopic) {
    baseChips.push({
      label: "Açık konu",
      value: input.activeTopic,
    });
  }

  const topicSentence =
    input.primaryResource?.topics && input.primaryResource.topics.length > 0
      ? ` Şu an ${input.primaryResource.topics.slice(0, 2).join(" ve ")} hattı burada daha görünür.`
      : "";
  const activeTopicSentence = input.activeTopic
    ? ` Son açılan konu hattı ${input.activeTopic}.`
    : "";
  const resourceSentence = input.primaryResource
    ? ` Kaynak tarafında ${input.primaryResource.title} daha doğru bir giriş veriyor; istersen ${input.primaryResource.actionLabel.toLocaleLowerCase("tr-TR")} hattını buradan kur.${topicSentence}`
    : activeTopicSentence;
  const focusContextSentence = input.primaryResource ? activeTopicSentence : "";

  if (input.dailyGoalMinutes > 0 && remainingGoalMinutes === 0) {
    return {
      headline: "Bugünkü hedef kapanmış görünüyor.",
      body: nextExam
        ? `${nextExam.title} yaklaşırken ${focus.title} tarafında kısa bir toparlama iyi durabilir.${focusContextSentence}${resourceSentence}`
        : `${focus.title} tarafında hafif bir toparlama ile günü sakin biçimde kapatabilirsin.${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "switch") {
    return {
      headline: `${focus.title} bugün daha doğru odak oluyor.`,
      body: `${input.homeFocus.reason} Kalan günlük alanı burada toplamak daha dengeli duruyor.${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "continue") {
    return {
      headline: `${focus.title} odağını koru.`,
      body: `${input.homeFocus.reason} Bugünün kalan alanı burada daha iyi karşılık veriyor.${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  return {
    headline: `${focus.title} bugün öne çıkıyor.`,
    body: nextExam
      ? `${nextExam.title} yaklaşırken bugünün ilk ciddi odağını burada kurmak daha doğru görünüyor.${focusContextSentence}${resourceSentence}`
      : `Bugünün ilk ciddi odağını burada kurmak günü daha sakin ve net toplar.${focusContextSentence}${resourceSentence}`,
    chips: baseChips,
  };
}
