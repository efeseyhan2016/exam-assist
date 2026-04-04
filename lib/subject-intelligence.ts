import { ContentTypeHint, StudyMode, SubjectSeed } from "@/lib/types";

// ─── Curriculum Seed Patterns ─────────────────────────────────────────────────
// Based on common Turkish university and high school subject naming conventions.
// Subjects that require problem-solving and drills → practice
// Subjects that require systematic reading and memorization → reading

const PRACTICE_PATTERNS: RegExp[] = [
  /matematik|calculus|analiz|lineer cebir|diferansiyel|integral|trigonometri|geometri/i,
  /fizik|mekanik|elektromanyetizma|termodinamik|optik|dalga mekani/i,
  /kimya|organik kimya|anorganik|stokiometri|mol hesab/i,
  /istatistik|olasılık|kombinatorik|kestirim|regresyon/i,
  /programlama|algoritma|veri yapı|yazılım mühendisliği|veri tabanı|bilgisayar programlama/i,
  /elektronik|devre analiz|sinyal işleme|kontrol sistem|elektrik mühendisliği/i,
  /muhasebe|maliyet muhasebe|bilanço|finansal muhase/i,
  /mühendislik matematiği|sayısal analiz|nümerik yöntem/i,
];

const READING_PATTERNS: RegExp[] = [
  /tarih|osmanlı|cumhuriyet tarihi|türk tarihi|inkılap|dünya tarihi/i,
  /\bait\b|atatürk ilkeleri|atatürk inkılap/i,
  /türk dili|türkçe|yazılı anlatım|sözlü anlatım|dilbilgisi/i,
  /edebiyat|türk edebiyatı|dünya edebiyatı|şiir çözümleme/i,
  /hukuk|anayasa|borçlar|ceza hukuku|ticaret hukuku|medeni hukuk/i,
  /felsefe|etik|mantık|epistemoloji|metafizik/i,
  /sosyoloji|toplum bilimleri|sosyal değişme|toplumsal/i,
  /psikoloji|davranış bilimleri|bilişsel psikoloji/i,
  /coğrafya|iklim bilgisi|nüfus|kentleşme|bölgesel coğrafya/i,
  /biyoloji|genetik|ekoloji|evrim|hücre biyolojisi/i,
  /iktisat|ekonomi|makroekonomi|mikroekonomi|kalkınma ekonomisi/i,
  /işletme|pazarlama|yönetim|örgütsel davranış|insan kaynakları/i,
  /siyaset bilimi|uluslararası ilişki|kamu yönetimi|siyasi düşünceler/i,
  /din kültürü|ilahiyat|teoloji|kelam|fıkıh/i,
  /sosyal bilgiler|vatandaşlık/i,
];

function matchesAny(title: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(title));
}

function deriveFromTitle(title: string): StudyMode | null {
  const isPractice = matchesAny(title, PRACTICE_PATTERNS);
  const isReading = matchesAny(title, READING_PATTERNS);
  if (isPractice && !isReading) return "practice";
  if (isReading && !isPractice) return "reading";
  if (isPractice && isReading) return "mixed";
  return null;
}

function deriveFromSeeds(seed: SubjectSeed): StudyMode {
  const p = seed.practiceNeed;   // 0–5
  const c = seed.contentLoad;    // 0–5
  if (p >= 3.5 && c < 3.0) return "practice";
  if (c >= 3.5 && p < 3.0) return "reading";
  return "mixed";
}

function deriveFromContentHints(hints: ContentTypeHint[]): StudyMode | null {
  const meaningful = hints.filter((h) => h !== "unknown");
  if (meaningful.length === 0) return null;
  const formulaRatio = meaningful.filter((h) => h === "formula-heavy").length / meaningful.length;
  const proseRatio = meaningful.filter((h) => h === "prose-heavy").length / meaningful.length;
  if (formulaRatio >= 0.6) return "practice";
  if (proseRatio >= 0.6) return "reading";
  return "mixed";
}

/**
 * Derives the study mode for a subject using three signals (in priority order):
 * 1. Subject title matched against curriculum patterns
 * 2. Content fingerprints from uploaded PDFs
 * 3. Numeric seed scores (practiceNeed, contentLoad)
 *
 * When signals conflict, defaults to "mixed" to avoid overconfident guidance.
 */
export function deriveStudyMode(
  seed: SubjectSeed,
  contentHints: ContentTypeHint[] = [],
): StudyMode {
  const fromTitle = deriveFromTitle(seed.title);
  const fromHints = deriveFromContentHints(contentHints);
  const fromSeeds = deriveFromSeeds(seed);

  // Title match is strongest signal
  if (fromTitle !== null) {
    // If PDF content contradicts title, be conservative
    if (fromHints !== null && fromTitle !== fromHints) return "mixed";
    return fromTitle;
  }

  // No title match: trust hints if available, else fall back to seed scores
  return fromHints ?? fromSeeds;
}

// ─── Study Intelligence ───────────────────────────────────────────────────────

export interface StudyIntelligence {
  mode: StudyMode;
  /** Primary session action label, e.g. "Soru çöz" */
  sessionLabel: string;
  /** Action verb used in guidance copy, e.g. "çöz" */
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
    case "practice":
      return {
        mode,
        sessionLabel: "Soru çöz",
        actionVerb: "çöz",
        resourceMetric: "sessions",
        recommendedSessionMinutes: 45,
        emptyStateHint:
          "Soru bankası, problem seti veya ders notları yükleyebilirsin. Bu ders için asıl ilerleme seans loglarınla ölçülür — sayfa takibi isteğe bağlıdır.",
        analysisNote:
          "Bu ders soru çözme odaklıdır. Materyali referans olarak kullan, asıl ilerlemeni seans loglarından takip et.",
      };
    case "reading":
      return {
        mode,
        sessionLabel: "Oku ve not al",
        actionVerb: "oku",
        resourceMetric: "pages",
        recommendedSessionMinutes: 30,
        emptyStateHint:
          "Ders kitabı, özet veya notlarını yükle. Sayfa ilerlemen buradan takip edilir ve sınava kadar günlük hedefin hesaplanır.",
        analysisNote:
          "Bu ders okuma ağırlıklıdır. Günlük sayfa hedefine odaklan ve düzenli tekrar yap.",
      };
    case "mixed":
    default:
      return {
        mode,
        sessionLabel: "Oku, sonra uygula",
        actionVerb: "çalış",
        resourceMetric: "pages",
        recommendedSessionMinutes: 40,
        emptyStateHint:
          "Ders notları veya kaynakları yükle. Önce kavramları oku, ardından sorularla pekiştir.",
        analysisNote:
          "Bu ders hem okuma hem uygulama gerektiriyor. Kavramı okuyarak anla, ardından soru çözerek pekiştir.",
      };
  }
}
