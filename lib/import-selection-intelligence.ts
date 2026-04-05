import {
  canonicalizeDepartmentName,
  inferDepartmentMatchScore,
  inferTitleLanguageHint,
} from "@/lib/profile-options";
import {
  ImportSelectionMemoryEntry,
  TitleLanguageHint,
} from "@/lib/types";

interface ImportSignalInput {
  title: string;
  courseCode?: string;
  departmentHint?: string;
}

const TITLE_STOPWORDS = new Set([
  "ve",
  "ile",
  "icin",
  "için",
  "the",
  "and",
  "for",
  "of",
  "to",
  "ii",
  "iii",
  "iv",
  "vi",
  "vii",
  "viii",
  "dersi",
  "course",
  "lesson",
]);

function normalizeFreeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCourseCode(value?: string) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

function buildTitleTokens(title: string) {
  return [...new Set(
    normalizeFreeText(title)
      .split(" ")
      .filter((token) => token.length >= 3 && !TITLE_STOPWORDS.has(token)),
  )].slice(0, 8);
}

function buildTitleFingerprint(title: string) {
  return buildTitleTokens(title).join(" ");
}

function normalizeDepartmentHint(value?: string) {
  if (!value?.trim()) return "";
  return normalizeFreeText(canonicalizeDepartmentName(value));
}

export function buildImportSelectionMemoryEntry(
  input: ImportSignalInput,
): ImportSelectionMemoryEntry {
  return {
    titleFingerprint: buildTitleFingerprint(input.title),
    titleTokens: buildTitleTokens(input.title),
    courseCode: normalizeCourseCode(input.courseCode),
    departmentHint: normalizeDepartmentHint(input.departmentHint),
    titleLanguage: inferTitleLanguageHint(input.title),
  };
}

export function mergeImportSelectionHistory(
  existing: ImportSelectionMemoryEntry[],
  selected: ImportSignalInput[],
  limit = 24,
) {
  const nextEntries = selected
    .map((entry) => buildImportSelectionMemoryEntry(entry))
    .filter(
      (entry) =>
        entry.titleFingerprint ||
        entry.courseCode ||
        entry.departmentHint ||
        entry.titleLanguage !== "mixed",
    );

  const merged = [...nextEntries, ...existing];
  const seen = new Set<string>();
  const deduped: ImportSelectionMemoryEntry[] = [];

  for (const entry of merged) {
    const key = [
      entry.courseCode,
      entry.titleFingerprint,
      entry.departmentHint,
      entry.titleLanguage,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(entry);

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function scoreAgainstEntry(
  candidate: ImportSelectionMemoryEntry,
  memory: ImportSelectionMemoryEntry,
) {
  let score = 0;

  if (candidate.courseCode && candidate.courseCode === memory.courseCode) {
    score += 5;
  }

  const overlap = candidate.titleTokens.filter((token) =>
    memory.titleTokens.includes(token),
  ).length;
  if (overlap >= 3) score += 4;
  else if (overlap === 2) score += 3;
  else if (overlap === 1) score += 1;

  if (candidate.departmentHint && memory.departmentHint) {
    const departmentScore = inferDepartmentMatchScore(
      candidate.departmentHint,
      memory.departmentHint,
    );
    score += Math.min(departmentScore, 2);
  }

  if (
    candidate.titleLanguage !== "mixed" &&
    candidate.titleLanguage === memory.titleLanguage
  ) {
    score += 1;
  }

  return score;
}

export function scoreCandidateAgainstImportHistory(
  candidate: ImportSignalInput,
  history: ImportSelectionMemoryEntry[],
) {
  if (history.length === 0) return 0;

  const normalizedCandidate = buildImportSelectionMemoryEntry(candidate);
  let best = 0;

  for (const entry of history) {
    best = Math.max(best, scoreAgainstEntry(normalizedCandidate, entry));
  }

  return best;
}

export function inferDominantImportLanguage(
  history: ImportSelectionMemoryEntry[],
): TitleLanguageHint {
  const counts: Record<TitleLanguageHint, number> = {
    tr: 0,
    en: 0,
    mixed: 0,
  };

  for (const entry of history) {
    counts[entry.titleLanguage] += 1;
  }

  if (counts.tr === counts.en && counts.tr === 0) return "mixed";
  if (counts.tr >= counts.en && counts.tr >= counts.mixed) return "tr";
  if (counts.en >= counts.tr && counts.en >= counts.mixed) return "en";
  return "mixed";
}
