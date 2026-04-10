export type ExamProximityStage =
  | "completed"
  | "semester"
  | "transition"
  | "exam"
  | "review"
  | "final";

export interface ExamProximityProfile {
  stage: ExamProximityStage;
  label: string;
  summary: string;
  narrowsScope: boolean;
  prefersConsolidation: boolean;
  prefersQuickReview: boolean;
}

const HOUR = 1;
const DAY = 24 * HOUR;

export function getExamProximityProfile(hoursUntilExam: number): ExamProximityProfile {
  if (hoursUntilExam <= 0) {
    return {
      stage: "completed",
      label: "Bitti",
      summary: "Sınav tamamlandı; kaynaklar artık sonuç değerlendirmesi ve tekrar referansı.",
      narrowsScope: false,
      prefersConsolidation: true,
      prefersQuickReview: false,
    };
  }

  if (hoursUntilExam <= DAY) {
    return {
      stage: "final",
      label: "Son gün",
      summary: "Yeni öğrenmeden çok kısa review ve yüksek etkili başlıklarda kal.",
      narrowsScope: true,
      prefersConsolidation: true,
      prefersQuickReview: true,
    };
  }

  if (hoursUntilExam <= 2 * DAY) {
    return {
      stage: "review",
      label: "Toparlama",
      summary: "Yeni alan açmaktan çok eldeki yapıyı toparlamak daha doğru.",
      narrowsScope: true,
      prefersConsolidation: true,
      prefersQuickReview: false,
    };
  }

  if (hoursUntilExam <= 7 * DAY) {
    return {
      stage: "exam",
      label: "Sınav modu",
      summary: "Kalan süre daha seçici ve dar odaklı ilerlemeyi istiyor.",
      narrowsScope: true,
      prefersConsolidation: false,
      prefersQuickReview: false,
    };
  }

  if (hoursUntilExam <= 14 * DAY) {
    return {
      stage: "transition",
      label: "Yaklaşan sınav",
      summary: "Odak daralmaya başladı; kritik başlıkları öne almak daha doğru.",
      narrowsScope: false,
      prefersConsolidation: false,
      prefersQuickReview: false,
    };
  }

  return {
    stage: "semester",
    label: "Dönem modu",
    summary: "Alanı sakin ama kararlı biçimde kurmak için hâlâ yer var.",
    narrowsScope: false,
    prefersConsolidation: false,
    prefersQuickReview: false,
  };
}
