import { HomeFocusRecommendation } from "@/lib/home-focus";
import { getExamProximityProfile } from "@/lib/exam-proximity";
import { buildStudyRecommendationSentence } from "@/lib/study-recommendation";
import { formatMinutesAsHours, formatRelativeDuration } from "@/lib/time";
import { RankedSubjectRisk, StudySessionReflection } from "@/lib/types";

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
  topicCoverage?: {
    nextTopic?: string | null;
    weakTopics?: string[];
    openTopics?: string[];
    coveredCount?: number;
  } | null;
  latestReflection?: StudySessionReflection | null;
  learningReason?: string | null;
}

export interface DailyBrief {
  modeLabel: string;
  recommendation: string | null;
  recommendedMinutes: number | null;
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
  const proximity = getExamProximityProfile(
    nextExam
      ? nextExam.countdown.totalMilliseconds / 3_600_000
      : input.homeFocus?.subject.hoursUntilExam ?? Number.POSITIVE_INFINITY,
  );

  if (!input.homeFocus || !input.topRisk) {
    return {
      modeLabel: "Hazırlanıyor",
      recommendation: null,
      recommendedMinutes: null,
      headline: "Bugünün kısa planı birazdan netleşecek.",
      body: "Sınavlar ve dersler hazır olduğunda bugünkü çalışma yaklaşımı burada görünür.",
      chips: [],
    };
  }

  const focus = input.homeFocus.subject;
  const recommendation = buildStudyRecommendationSentence({
    subjectTitle: focus.title,
    hoursUntilExam: focus.hoursUntilExam,
    remainingGoalMinutes,
    riskLabel: focus.label,
    mode: input.homeFocus.mode,
    lastReflection: input.latestReflection ?? undefined,
  });
  const baseChips = [
    { label: "Ritim", value: proximity.label },
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
        label: "Öne çıkan konu",
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
  if (input.topicCoverage?.nextTopic) {
    baseChips.push({
      label: "Şimdi konu",
      value: input.topicCoverage.nextTopic,
    });
  }

  const topicSentence =
    input.primaryResource?.topics && input.primaryResource.topics.length > 0
      ? ` Şu an ${input.primaryResource.topics.slice(0, 2).join(" ve ")} burada daha görünür.`
      : "";
  const activeTopicSentence = input.activeTopic
    ? ` Son açılan konu ${input.activeTopic}.`
    : "";
  const resourceSentence = input.primaryResource
    ? ` Kaynak tarafında ${input.primaryResource.title} daha doğru bir giriş veriyor; istersen ${input.primaryResource.actionLabel.toLocaleLowerCase("tr-TR")} ile başlayabilirsin.${topicSentence}`
    : activeTopicSentence;
  const focusContextSentence = input.primaryResource ? activeTopicSentence : "";
  const reflectionSentence =
    input.latestReflection === "stuck"
      ? " Son tur burada takıldın; bu yüzden bugünkü öneri daha dar tutuldu."
      : input.latestReflection === "surface"
        ? " Son blok biraz yüzeyde kaldı; bu tur tek bir konuya yaslanmak daha iyi olabilir."
        : input.latestReflection === "good"
          ? " Son blok iyi aktı; aynı yaklaşımı biraz daha sürdürmek mantıklı."
          : "";
  const learningSentence = input.learningReason ? ` ${input.learningReason}` : "";
  const coverageSentence =
    input.topicCoverage?.weakTopics?.[0]
      ? ` ${input.topicCoverage.weakTopics[0]} burada biraz daha dikkat istiyor.`
      : input.topicCoverage?.openTopics?.[0]
        ? ` ${input.topicCoverage.openTopics[0]} tarafı henüz açılmadı; bugünkü blok için iyi bir giriş olabilir.`
        : input.topicCoverage?.nextTopic &&
            input.topicCoverage.nextTopic !== input.activeTopic
          ? ` Bugünkü blokta ${input.topicCoverage.nextTopic} tarafını öne almak daha anlamlı duruyor.`
          : input.topicCoverage?.coveredCount && input.topicCoverage.coveredCount > 0
            ? " Bazı başlıklar artık daha oturmuş görünüyor."
            : "";

  // Single proximity sentence — most specific stage wins, no pileup.
  const proximitySentence = proximity.prefersQuickReview
    ? " Son gün yaklaşırken kısa ve temiz bir review daha iyi karşılık verir."
    : proximity.prefersConsolidation
    ? " Bu aşamada yeni alan açmaktan çok eldeki yapıyı toparlamak daha güçlü durur."
    : proximity.narrowsScope
    ? " Bugünün bloğunu daha dar bir odakta kurmak daha doğru."
    : " Bugünün bloğunu burada kurmak haftayı daha dengeli toplar.";

  // Shared next-exam context — brief, appended only when relevant.
  const nextExamContext = nextExam
    ? ` ${nextExam.shortLabel} sınavı yaklaşırken buradan başlamak daha doğru.`
    : "";

  if (input.dailyGoalMinutes > 0 && remainingGoalMinutes === 0) {
    return {
      modeLabel: proximity.label,
      recommendation: recommendation.sentence,
      recommendedMinutes: recommendation.blockMinutes,
      headline: "Bugünkü hedef kapanmış görünüyor.",
      body: `${focus.title} tarafında kısa bir toparlama iyi durabilir.${reflectionSentence}${coverageSentence}${proximitySentence}${learningSentence}${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "switch") {
    return {
      modeLabel: proximity.label,
      recommendation: recommendation.sentence,
      recommendedMinutes: recommendation.blockMinutes,
      headline: `${focus.title} bugün daha doğru odak oluyor.`,
      body: `${input.homeFocus.reason}${reflectionSentence}${coverageSentence}${proximitySentence}${learningSentence}${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  if (input.homeFocus.mode === "continue") {
    return {
      modeLabel: proximity.label,
      recommendation: recommendation.sentence,
      recommendedMinutes: recommendation.blockMinutes,
      headline: `${focus.title} odağını koru.`,
      body: `${input.homeFocus.reason}${reflectionSentence}${coverageSentence}${proximitySentence}${learningSentence}${focusContextSentence}${resourceSentence}`,
      chips: baseChips,
    };
  }

  return {
    modeLabel: proximity.label,
    recommendation: recommendation.sentence,
    recommendedMinutes: recommendation.blockMinutes,
    headline: `${focus.title} bugün öne çıkıyor.`,
    body: `${focus.title} şu an en güçlü ilk adım.${nextExamContext}${reflectionSentence}${coverageSentence}${proximitySentence}${learningSentence}${focusContextSentence}${resourceSentence}`,
    chips: baseChips,
  };
}
