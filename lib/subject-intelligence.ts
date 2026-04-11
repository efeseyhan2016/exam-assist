import { ContentTypeHint, StudyMode, StudySession, SubjectSeed } from "@/lib/types";

export type SubjectDomain =
  | "history"
  | "law"
  | "language"
  | "business"
  | "economics"
  | "psychology"
  | "math"
  | "science"
  | "engineering"
  | "general";

// ─── Text Normalisation ───────────────────────────────────────────────────────
// Applied to both course titles and short labels before any pattern matching.
// Strips diacritics, lowercases with TR locale, collapses whitespace.

function normalizeForMatching(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Course Code Alias Table ──────────────────────────────────────────────────
// Maps normalised course-code prefixes (letters only, no digits) to study mode.
// These are the most reliable signal: Turkish university course codes are highly
// standardised across institutions, far more reliable than free-text title matching.
//
// Priority: alias table → title pattern matching → content fingerprint → session.

const COURSE_CODE_ALIASES: Readonly<Record<string, StudyMode>> = {
  // ── Quantitative / Problem ────────────────────────────────────────────────
  mat:  "problem",  // Matematik
  sta:  "problem",  // Statik / Statics
  ist:  "problem",  // İstatistik
  ista: "problem",
  fiz:  "problem",  // Fizik
  kim:  "problem",  // Kimya
  ele:  "problem",  // Elektrik / Elektronik
  ee:   "problem",
  bm:   "problem",  // Bilgisayar Mühendisliği
  bil:  "problem",  // Bilgisayar
  ie:   "problem",  // Endüstri Mühendisliği
  end:  "problem",
  mme:  "problem",  // Makine Mühendisliği
  ins:  "problem",  // İnşaat
  mus:  "problem",  // Muhasebe
  muh:  "problem",  // Mühendislik (generic prefix)
  fin:  "problem",  // Finance (quantitative variant)
  eko:  "problem",  // Ekonometri (when used for quant courses)

  // ── Memorisation ──────────────────────────────────────────────────────────
  ait:  "memorization",  // Atatürk İlkeleri ve İnkılap Tarihi
  tar:  "memorization",  // Tarih
  huk:  "memorization",  // Hukuk
  tdk:  "memorization",  // Türk Dili ve Kompozisyon
  tdb:  "memorization",
  td:   "memorization",  // Türk Dili
  din:  "memorization",  // Din Kültürü
  ilh:  "memorization",  // İlahiyat
  ana:  "memorization",  // Anatomi
  far:  "memorization",  // Farmakoloji

  // ── Interpretive ──────────────────────────────────────────────────────────
  man:  "interpretive",  // Yönetim / Management
  ism:  "interpretive",  // İşletme
  isl:  "interpretive",
  pzl:  "interpretive",  // Pazarlama
  mkt:  "interpretive",  // Marketing
  ykm:  "interpretive",  // Yönetim
  sir:  "interpretive",  // Siyasi İletişim / similar
  siy:  "interpretive",  // Siyaset Bilimi
  ikt:  "interpretive",  // İktisadi / Ekonomi
  psi:  "interpretive",  // Psikoloji
  pdr:  "interpretive",  // Psikolojik Danışma
  sos:  "interpretive",  // Sosyoloji
  ede:  "interpretive",  // Edebiyat
  fel:  "interpretive",  // Felsefe

  // ── Conceptual ────────────────────────────────────────────────────────────
  bio:  "conceptual",  // Biology (EN)
  biy:  "conceptual",  // Biyoloji
  cog:  "conceptual",  // Coğrafya
  cfy:  "conceptual",
  cev:  "conceptual",  // Çevre Bilimi
  fzy:  "conceptual",  // Fizyoloji
};

const COURSE_CODE_DOMAINS: Readonly<Record<string, SubjectDomain>> = {
  ait: "history",
  tar: "history",
  huk: "law",
  td: "language",
  tdk: "language",
  tdb: "language",
  man: "business",
  ism: "business",
  isl: "business",
  pzl: "business",
  mkt: "business",
  ikt: "economics",
  psi: "psychology",
  pdr: "psychology",
  mat: "math",
  ist: "math",
  ista: "math",
  sta: "math",
  fiz: "science",
  kim: "science",
  biy: "science",
  bio: "science",
  ele: "engineering",
  ee: "engineering",
  muh: "engineering",
  bm: "engineering",
  ie: "engineering",
  end: "engineering",
  mme: "engineering",
  ins: "engineering",
};

/**
 * Extracts the alphabetic prefix from a course short label.
 * "MAN426" → "man", "AIT201" → "ait", "STA" → "sta", "İST203" → "ist"
 *
 * Uses plain English toLowerCase() — NOT TR-locale — because course codes are
 * ASCII uppercase. TR-locale would map "I" → "ı" (dotless-i), turning "AIT" into
 * "aıt" which would miss the alias table entry "ait".
 */
function extractCodePrefix(shortLabel: string): string | null {
  // Strip diacritics first so "İST" (U+0130) → "ist" via Unicode lowercase mapping
  const ascii = shortLabel
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const match = ascii.match(/^([a-z]+)/);
  return match?.[1] ?? null;
}

// ─── Curriculum Study Patterns ────────────────────────────────────────────────
// The goal is not to label a course perfectly, but to separate university-style
// study approaches more honestly than a flat "reading vs practice" split.
// Title patterns are checked AFTER course code aliases.

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

function matchesAny(normalizedTitle: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(normalizedTitle));
}

const TITLE_PATTERN_GROUPS: Array<[StudyMode, RegExp[]]> = [
  ["problem", PROBLEM_PATTERNS],
  ["memorization", MEMORIZATION_PATTERNS],
  ["interpretive", INTERPRETIVE_PATTERNS],
  ["conceptual", CONCEPTUAL_PATTERNS],
];

/**
 * Derives study mode from the course title and optional short label.
 *
 * Resolution order:
 * 1. Course-code alias table — most reliable for TR universities (e.g. MAN426 → interpretive)
 * 2. Normalized title pattern matching — multi-lingual pattern sets, diacritic-safe
 *
 * Returns null when no signal can be extracted (caller falls back to content hints / seeds).
 */
function deriveFromTitle(title: string, shortLabel: string = ""): StudyMode | null {
  // 1. Course code alias — extracted from short label, beats title patterns
  const codePrefix = extractCodePrefix(shortLabel);
  if (codePrefix) {
    const aliasMode = COURSE_CODE_ALIASES[codePrefix];
    if (aliasMode) return aliasMode;
  }

  // 2. Normalized title matching — diacritics stripped, lowercased with TR locale
  const normalized = normalizeForMatching(title);
  const matches = TITLE_PATTERN_GROUPS
    .filter(([, patterns]) => matchesAny(normalized, patterns))
    .map(([mode]) => mode);

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  return "mixed";
}

export function deriveSubjectDomain(seed: Pick<SubjectSeed, "title" | "shortLabel">): SubjectDomain {
  const codePrefix = extractCodePrefix(seed.shortLabel ?? "");
  if (codePrefix) {
    const aliasDomain = COURSE_CODE_DOMAINS[codePrefix];
    if (aliasDomain) return aliasDomain;
  }

  const normalized = normalizeForMatching(seed.title);

  if (/\bait\b|atatürk ilkeleri|inkılap|cumhuriyet tarihi|osmanlı|dünya tarihi|tarih/i.test(normalized)) {
    return "history";
  }
  if (/hukuk|anayasa|borçlar|ceza hukuku|ticaret hukuku|medeni hukuk|law/i.test(normalized)) {
    return "law";
  }
  if (/türk dili|türkçe|yazılı anlatım|dilbilgisi|language|grammar/i.test(normalized)) {
    return "language";
  }
  if (/işletme|management|marketing|örgütsel davranış|insan kaynakları|business/i.test(normalized)) {
    return "business";
  }
  if (/iktisat|ekonomi|makroekonomi|mikroekonomi|economics/i.test(normalized)) {
    return "economics";
  }
  if (/psikoloji|personality|social psychology|cognitive psychology|psychology/i.test(normalized)) {
    return "psychology";
  }
  if (/matematik|calculus|istatistik|statistics|lineer cebir|regresyon/i.test(normalized)) {
    return "math";
  }
  if (/biyoloji|kimya|fizik|genetik|ekoloji|science|biology|chemistry|physics/i.test(normalized)) {
    return "science";
  }
  if (/mühendislik|elektrik|elektronik|algoritma|programlama|devre|engineering/i.test(normalized)) {
    return "engineering";
  }

  return "general";
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
  learningHint: StudyMode | null = null,
): StudyMode {
  const fromTitle = deriveFromTitle(seed.title, seed.shortLabel ?? "");
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

  // No content hints either: use learned behavior first, then raw session shape, then seeds
  return learningHint ?? sessionHint ?? fromSeeds;
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
        sessionLabel: "Uygulama ağırlıklı ilerle",
        actionVerb: "pekiştir",
        resourceMetric: "sessions",
        recommendedSessionMinutes: 45,
        emptyStateHint:
          "Problem setleri, çıkmış sorular veya ders notları ekleyebilirsin. Bu derste ana ilerleme sinyali sayfadan çok çalışma bloklarından gelir.",
        analysisNote:
          "Bu ders uygulama ve pekiştirme ağırlıklı ilerler. Kaynakları yardımcı bir zemin gibi kullanmak daha doğru olur.",
      };
    case "conceptual":
      return {
        mode,
        sessionLabel: "Kavramsal okuma ile ilerle",
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
        sessionLabel: "Temaları ve ana fikirleri netleştir",
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
        sessionLabel: "Terimleri ve ana yapıyı toparla",
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
