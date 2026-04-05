import { ContentTypeHint, StudyMode, SubjectSeed } from "@/lib/types";

// ─── Curriculum Study Patterns ────────────────────────────────────────────────
// The goal is not to label a course perfectly, but to separate university-style
// study approaches more honestly than a flat "reading vs practice" split.

const PROBLEM_PATTERNS: RegExp[] = [
  /matematik|calculus|analiz|lineer cebir|diferansiyel|integral|trigonometri|geometri/i,
  /fizik|mekanik|elektromanyetizma|termodinamik|optik|dalga mekani/i,
  /kimya|organik kimya|anorganik|stokiometri|mol hesab/i,
  /istatistik|olasılık|kombinatorik|kestirim|regresyon/i,
  /programlama|algoritma|veri yapı|yazılım mühendisliği|veri tabanı|bilgisayar programlama/i,
  /elektronik|devre analiz|sinyal işleme|kontrol sistem|elektrik mühendisliği/i,
  /muhasebe|maliyet muhasebe|bilanço|finansal muhase/i,
  /mühendislik matematiği|sayısal analiz|nümerik yöntem/i,
];

const MEMORIZATION_PATTERNS: RegExp[] = [
  /tarih|osmanlı|cumhuriyet tarihi|türk tarihi|inkılap|dünya tarihi/i,
  /\bait\b|atatürk ilkeleri|atatürk inkılap/i,
  /türk dili|türkçe|yazılı anlatım|sözlü anlatım|dilbilgisi/i,
  /hukuk|anayasa|borçlar|ceza hukuku|ticaret hukuku|medeni hukuk/i,
  /anatomi|farmakoloji|patoloji|mikrobiyoloji|histoloji/i,
];

const INTERPRETIVE_PATTERNS: RegExp[] = [
  /edebiyat|türk edebiyatı|dünya edebiyatı|şiir çözümleme/i,
  /felsefe|etik|mantık|epistemoloji|metafizik/i,
  /sosyoloji|toplum bilimleri|sosyal değişme|toplumsal/i,
  /psikoloji|davranış bilimleri|bilişsel psikoloji/i,
  /iktisat|ekonomi|makroekonomi|mikroekonomi|kalkınma ekonomisi/i,
  /işletme|pazarlama|yönetim|örgütsel davranış|insan kaynakları/i,
  /siyaset bilimi|uluslararası ilişki|kamu yönetimi|siyasi düşünceler/i,
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
    if (fromHints !== null && !isCompatibleHintMode(fromTitle, fromHints)) return "mixed";
    return fromTitle;
  }

  // No title match: trust hints if available, else fall back to seed scores
  return fromHints ?? fromSeeds;
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
