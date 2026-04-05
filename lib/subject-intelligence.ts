import { ContentTypeHint, StudyMode, StudySession, SubjectSeed } from "@/lib/types";

// ─── Curriculum Study Patterns ────────────────────────────────────────────────
// The goal is not to label a course perfectly, but to separate university-style
// study approaches more honestly than a flat "reading vs practice" split.

const PROBLEM_PATTERNS: RegExp[] = [
  /matematik|calculus|analiz|lineer cebir|diferansiyel|integral|trigonometri|geometri/i,
  /fizik|mekanik|elektromanyetizma|termodinamik|optik|dalga mekani/i,
  /kimya|organik kimya|anorganik|stokiometri|mol hesab/i,
  /istatistik|olasılık|kombinatorik|kestirim|regresyon/i,
  // English equivalents: quantitative / STEM
  /\bstatistics\b|econometrics|quantitative methods|\bcalculus\b|linear algebra/i,
  /programlama|algoritma|veri yapı|yazılım mühendisliği|veri tabanı|bilgisayar programlama/i,
  /elektronik|devre analiz|sinyal işleme|kontrol sistem|elektrik mühendisliği/i,
  /muhasebe|maliyet muhasebe|bilanço|finansal muhase/i,
  // English equivalents: accounting disciplines
  /\baccounting\b|financial accounting|managerial accounting|cost accounting|\bauditing\b/i,
  /mühendislik matematiği|sayısal analiz|nümerik yöntem/i,
];

const MEMORIZATION_PATTERNS: RegExp[] = [
  /tarih|osmanlı|cumhuriyet tarihi|türk tarihi|inkılap|dünya tarihi/i,
  /\bait\b|atatürk ilkeleri|atatürk inkılap/i,
  /türk dili|türkçe|yazılı anlatım|sözlü anlatım|dilbilgisi/i,
  /hukuk|anayasa|borçlar|ceza hukuku|ticaret hukuku|medeni hukuk/i,
  /law|constitutional law|commercial law|civil law|criminal law/i,
  /anatomi|farmakoloji|patoloji|mikrobiyoloji|histoloji/i,
];

const INTERPRETIVE_PATTERNS: RegExp[] = [
  /edebiyat|türk edebiyatı|dünya edebiyatı|şiir çözümleme/i,
  /felsefe|etik|mantık|epistemoloji|metafizik/i,
  /philosophy|ethics|logic|epistemology/i,
  /sosyoloji|toplum bilimleri|sosyal değişme|toplumsal/i,
  /sociology|social sciences|social change/i,
  /psikoloji|davranış bilimleri|bilişsel psikoloji/i,
  // English equivalents: psychology subfields (personality, social, developmental, etc.)
  /\bpsychology\b|personality|social psychology|cognitive psychology|developmental psychology|abnormal psychology/i,
  /kişilik|kişilik psikolojisi/i,
  /iktisat|ekonomi|makroekonomi|mikroekonomi|kalkınma ekonomisi/i,
  /economics|macroeconomics|microeconomics|development economics/i,
  /işletme|pazarlama|yönetim|örgütsel davranış|insan kaynakları/i,
  // English equivalents: business / management disciplines
  /\bmanagement\b|\bmarketing\b|organizational behavior|human resources|business administration/i,
  /new product development|product management|product and pricing|brand management|consumer behavior/i,
  /operations management|supply chain|strategic management|international business/i,
  /siyaset bilimi|uluslararası ilişki|kamu yönetimi|siyasi düşünceler/i,
  /political science|international relations|public administration/i,
  /din kültürü|ilahiyat|teoloji|kelam|fıkıh|sosyal bilgiler|vatandaşlık/i,
];

const CONCEPTUAL_PATTERNS: RegExp[] = [
  /biyoloji|genetik|ekoloji|evrim|hücre biyolojisi/i,
  /coğrafya|iklim bilgisi|nüfus|kentleşme|bölgesel coğrafya/i,
  /fizyoloji|biyokimya|moleküler biyoloji|jeoloji|çevre bilim/i,
];

function matchesAny(title: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(title));
}

const TITLE_PATTERN_GROUPS: Array<[StudyMode, RegExp[]]> = [
  ["problem", PROBLEM_PATTERNS],
  ["memorization", MEMORIZATION_PATTERNS],
  ["interpretive", INTERPRETIVE_PATTERNS],
  ["conceptual", CONCEPTUAL_PATTERNS],
];

function deriveFromTitle(title: string): StudyMode | null {
  const matches = TITLE_PATTERN_GROUPS
    .filter(([, patterns]) => matchesAny(title, patterns))
    .map(([mode]) => mode);

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return "mixed";
}

function deriveFromSeeds(seed: SubjectSeed): StudyMode {
  const p = seed.practiceNeed;   // 0–5
  const c = seed.contentLoad;    // 0–5
  if (p >= 3.5 && c < 3.0) return "problem";
  if (c >= 3.7 && p < 3.0) return "conceptual";
  return "mixed";
}

function deriveFromContentHints(hints: ContentTypeHint[]): StudyMode | null {
  const meaningful = hints.filter((h) => h !== "unknown");
  if (meaningful.length === 0) return null;
  const formulaRatio = meaningful.filter((h) => h === "formula-heavy").length / meaningful.length;
  const proseRatio = meaningful.filter((h) => h === "prose-heavy").length / meaningful.length;
  if (formulaRatio >= 0.6) return "problem";
  if (proseRatio >= 0.6) return "conceptual";
  return "mixed";
}

function isCompatibleHintMode(titleMode: StudyMode, hintMode: StudyMode) {
  if (hintMode === "mixed") return true;
  if (hintMode === "problem") return titleMode === "problem";
  if (hintMode === "conceptual") {
    return titleMode === "conceptual" || titleMode === "interpretive" || titleMode === "memorization";
  }
  return titleMode === hintMode;
}

// ─── Session Behavior Signal ──────────────────────────────────────────────────
// Weakest of the four signals. Derived from the user's own study history for a
// subject. Only used when title patterns and content hints are both absent or
// inconclusive. Requires at least 3 logged sessions to emit a hint.
//
// Heuristic thresholds (intentionally coarse):
//   avg >= 45 min  → likely problem-mode work (sustained focus blocks)
//   avg <= 20 min  → likely memorization (short review bursts)
//   otherwise      → inconclusive, return null

const SESSION_BEHAVIOR_MIN_COUNT = 3;
const SESSION_BEHAVIOR_PROBLEM_THRESHOLD = 45;
const SESSION_BEHAVIOR_MEMORIZATION_THRESHOLD = 20;

/**
 * Inspects a user's logged sessions for a specific subject and returns a weak
 * study-mode hint based on average session duration.
 *
 * Returns null when there are fewer than 3 sessions (not enough signal) or
 * when the average is in the inconclusive middle range.
 */
export function deriveSessionBehaviorHint(
  sessions: StudySession[],
  subjectId: string,
): StudyMode | null {
  const subjectSessions = sessions.filter((s) => s.subjectId === subjectId);
  if (subjectSessions.length < SESSION_BEHAVIOR_MIN_COUNT) return null;

  const avgMinutes =
    subjectSessions.reduce((sum, s) => sum + s.minutes, 0) / subjectSessions.length;

  if (avgMinutes >= SESSION_BEHAVIOR_PROBLEM_THRESHOLD) return "problem";
  if (avgMinutes <= SESSION_BEHAVIOR_MEMORIZATION_THRESHOLD) return "memorization";
  return null;
}

/**
 * Derives the study mode for a subject using four signals (in priority order):
 * 1. Subject title matched against curriculum patterns  [strongest]
 * 2. Content fingerprints from uploaded PDFs
 * 3. Session behavior hint from logged study history    [weakest]
 * 4. Numeric seed scores (practiceNeed, contentLoad)   [final fallback]
 *
 * When signals conflict, defaults to "mixed" to avoid overconfident guidance.
 * Pass sessionHint from deriveSessionBehaviorHint() when sessions are available.
 */
export function deriveStudyMode(
  seed: SubjectSeed,
  contentHints: ContentTypeHint[] = [],
  sessionHint: StudyMode | null = null,
): StudyMode {
  const fromTitle = deriveFromTitle(seed.title);
  const fromHints = deriveFromContentHints(contentHints);
  const fromSeeds = deriveFromSeeds(seed);

  // Title match is strongest signal
  if (fromTitle !== null) {
    // If PDF content contradicts title, be conservative
    if (fromHints !== null && !isCompatibleHintMode(fromTitle, fromHints)) return "mixed";
    return fromTitle;
  }

  // No title match: trust content hints if present
  if (fromHints !== null) return fromHints;

  // No content hints either: use session behavior as weak tie-breaker, then seeds
  return sessionHint ?? fromSeeds;
}

// ─── Study Intelligence ───────────────────────────────────────────────────────

export interface StudyIntelligence {
  mode: StudyMode;
  /** Primary study-approach label, e.g. "Pratik odaklı ilerle" */
  sessionLabel: string;
  /** Action verb used in guidance copy, e.g. "pekiştir" */
  actionVerb: string;
  /** Whether pages or session logs are the primary progress metric */
  resourceMetric: "pages" | "sessions";
  /** Recommended single-session duration in minutes */
  recommendedSessionMinutes: number;
  /** Shown in empty-resource state — how to use this subject's library */
  emptyStateHint: string;
  /** Shown in analysis panel — study method context */
  analysisNote: string;
}

export function getStudyIntelligence(mode: StudyMode): StudyIntelligence {
  switch (mode) {
    case "problem":
      return {
        mode,
        sessionLabel: "Pratik odaklı ilerle",
        actionVerb: "pekiştir",
        resourceMetric: "sessions",
        recommendedSessionMinutes: 45,
        emptyStateHint:
          "Problem setleri, çıkmış sorular veya ders notları ekleyebilirsin. Bu derste ana ilerleme sinyali sayfadan çok çalışma bloklarından gelir.",
        analysisNote:
          "Bu ders uygulama ve pekiştirme ağırlıklı ilerler. Materyali referans katmanı gibi kullanmak daha doğru olur.",
      };
    case "conceptual":
      return {
        mode,
        sessionLabel: "Kavramsal okuma hattı",
        actionVerb: "yerleştir",
        resourceMetric: "pages",
        recommendedSessionMinutes: 30,
        emptyStateHint:
          "Ders kitabı, özet veya notlarını ekle. Bu derslerde ilerleme daha çok okuma derinliği ve kavram yerleşmesi üzerinden izlenir.",
        analysisNote:
          "Bu ders okuma ve kavram kurma ağırlıklı ilerler. Hızdan çok düzenli yerleşme daha önemlidir.",
      };
    case "interpretive":
      return {
        mode,
        sessionLabel: "Argüman ve tema hattını kur",
        actionVerb: "yorumla",
        resourceMetric: "pages",
        recommendedSessionMinutes: 35,
        emptyStateHint:
          "Makale, ders notu veya kısa özetler ekleyebilirsin. Bu derslerde ilerleme ana temaları, karşılaştırmaları ve yorum çizgisini kurmakla gelir.",
        analysisNote:
          "Bu ders yorumlama ve ilişki kurma ağırlıklıdır. Kavramları değil, aralarındaki bağı netleştirmek daha önemlidir.",
      };
    case "memorization":
      return {
        mode,
        sessionLabel: "Terim ve yapı hattını toparla",
        actionVerb: "toparla",
        resourceMetric: "pages",
        recommendedSessionMinutes: 30,
        emptyStateHint:
          "Özet, madde notu veya kısa tekrar kaynakları ekleyebilirsin. Bu derslerde ilerleme yapı ve terimleri düzenli biçimde yerleştirmekle gelir.",
        analysisNote:
          "Bu ders mevzuat, terim veya yapı yoğun ilerler. Dağılmadan toparlamak ve tekrar döngüsü kurmak daha önemlidir.",
      };
    case "mixed":
    default:
      return {
        mode,
        sessionLabel: "Kavramı kur, sonra uygula",
        actionVerb: "çalış",
        resourceMetric: "pages",
        recommendedSessionMinutes: 40,
        emptyStateHint:
          "Ders notlarını veya kaynaklarını ekle. Bu derste önce çerçeveyi kurup sonra uygulamaya dönmek daha sağlıklı olur.",
        analysisNote:
          "Bu ders hem kavramsal yerleşme hem uygulama gerektiriyor. Tek tip çalışma yerine dengeli bir akış daha iyi sonuç verir.",
      };
  }
}
