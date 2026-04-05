import {
  canonicalizeUniversityName,
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

interface ImportProfileContext {
  university?: string;
  department?: string;
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

function normalizeUniversityHint(value?: string) {
  if (!value?.trim()) return "";
  return normalizeFreeText(canonicalizeUniversityName(value));
}

export function buildImportSelectionMemoryEntry(
  input: ImportSignalInput,
  context?: ImportProfileContext,
): ImportSelectionMemoryEntry {
  return {
    titleFingerprint: buildTitleFingerprint(input.title),
    titleTokens: buildTitleTokens(input.title),
    courseCode: normalizeCourseCode(input.courseCode),
    departmentHint: normalizeDepartmentHint(input.departmentHint),
    titleLanguage: inferTitleLanguageHint(input.title),
    selectedCount: 1,
    dismissedCount: 0,
    profileUniversity: normalizeUniversityHint(context?.university),
    profileDepartment: normalizeDepartmentHint(context?.department),
  };
}

export function mergeImportSelectionHistory(
  existing: ImportSelectionMemoryEntry[],
  selected: ImportSignalInput[],
  dismissed: ImportSignalInput[] = [],
  context?: ImportProfileContext,
  limit = 24,
) {
  const nextEntries = [
    ...selected.map((entry) => ({
      ...buildImportSelectionMemoryEntry(entry, context),
      selectedCount: 1,
      dismissedCount: 0,
    })),
    ...dismissed.map((entry) => ({
      ...buildImportSelectionMemoryEntry(entry, context),
      selectedCount: 0,
      dismissedCount: 1,
    })),
  ].filter(
    (entry) =>
      entry.titleFingerprint ||
      entry.courseCode ||
      entry.departmentHint ||
      entry.titleLanguage !== "mixed",
  );

  const order = [...nextEntries, ...existing];
  const merged = new Map<string, ImportSelectionMemoryEntry>();

  for (const entry of [...existing, ...nextEntries]) {
    const key = [
      entry.courseCode,
      entry.titleFingerprint,
      entry.departmentHint,
      entry.titleLanguage,
      entry.profileUniversity,
      entry.profileDepartment,
    ].join("|");

    const current = merged.get(key);
    if (current) {
      current.selectedCount += entry.selectedCount;
      current.dismissedCount += entry.dismissedCount;
      continue;
    }

    merged.set(key, {
      ...entry,
      titleTokens: [...entry.titleTokens],
    });
  }

  const deduped: ImportSelectionMemoryEntry[] = [];
  const seen = new Set<string>();

  for (const entry of order) {
    const key = [
      entry.courseCode,
      entry.titleFingerprint,
      entry.departmentHint,
      entry.titleLanguage,
      entry.profileUniversity,
      entry.profileDepartment,
    ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);

    const aggregated = merged.get(key);
    if (!aggregated) continue;

    deduped.push(aggregated);

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
}

function scoreAgainstEntry(
  candidate: ImportSelectionMemoryEntry,
  memory: ImportSelectionMemoryEntry,
  context?: ImportProfileContext,
) {
  let similarity = 0;

  if (candidate.courseCode && candidate.courseCode === memory.courseCode) {
    similarity += 5;
  }

  const overlap = candidate.titleTokens.filter((token) =>
    memory.titleTokens.includes(token),
  ).length;
  if (overlap >= 3) similarity += 4;
  else if (overlap === 2) similarity += 3;
  else if (overlap === 1) similarity += 1;

  if (candidate.departmentHint && memory.departmentHint) {
    const departmentScore = inferDepartmentMatchScore(
      candidate.departmentHint,
      memory.departmentHint,
    );
    similarity += Math.min(departmentScore, 2);
  }

  if (
    candidate.titleLanguage !== "mixed" &&
    candidate.titleLanguage === memory.titleLanguage
  ) {
    similarity += 1;
  }

  if (similarity === 0) {
    return 0;
  }

  let contextBonus = 0;
  const normalizedUniversity = normalizeUniversityHint(context?.university);
  const normalizedDepartment = normalizeDepartmentHint(context?.department);

  if (
    memory.profileUniversity &&
    normalizedUniversity &&
    memory.profileUniversity === normalizedUniversity
  ) {
    contextBonus += 1;
  }

  if (
    memory.profileDepartment &&
    normalizedDepartment &&
    memory.profileDepartment === normalizedDepartment
  ) {
    contextBonus += 1;
  }

  return similarity + contextBonus;
}

export function scoreCandidateAgainstImportHistory(
  candidate: ImportSignalInput,
  history: ImportSelectionMemoryEntry[],
  context?: ImportProfileContext,
) {
  if (history.length === 0) return 0;

  const normalizedCandidate = buildImportSelectionMemoryEntry(candidate);
  let bestPositive = 0;
  let strongestNegative = 0;

  for (const entry of history) {
    const matchedScore = scoreAgainstEntry(normalizedCandidate, entry, context);
    if (matchedScore === 0) continue;

    if (entry.selectedCount > 0) {
      bestPositive = Math.max(
        bestPositive,
        matchedScore + Math.min(entry.selectedCount, 3),
      );
    }

    const dismissalPressure = Math.max(0, entry.dismissedCount - entry.selectedCount);
    if (dismissalPressure > 0) {
      strongestNegative = Math.max(
        strongestNegative,
        (matchedScore >= 3 ? 1.25 : 0.5) * Math.min(dismissalPressure, 2),
      );
    }
  }

  return bestPositive - strongestNegative;
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
