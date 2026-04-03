import { ScheduleItemKind } from "@/lib/types";

export interface ImportedScheduleItemInput {
  title: string;
  scheduledAt: string;
  kind: ScheduleItemKind;
  notes?: string;
}

export interface ScheduleImportResult {
  accepted: ImportedScheduleItemInput[];
  rejected: string[];
}

const supportedKinds = new Set<ScheduleItemKind>(["exam", "deadline"]);

function normalizeKind(raw: string | undefined): ScheduleItemKind {
  return raw?.trim().toLowerCase() === "deadline" ? "deadline" : "exam";
}

function normalizeDateTime(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const compact = raw.trim();
  if (!compact) {
    return null;
  }

  const prepared = compact.includes("T") ? compact : compact.replace(" ", "T");
  const parsed = new Date(prepared);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parseCsvLine(line: string) {
  return line
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildAcceptedItem(
  title: string | undefined,
  scheduledAtRaw: string | undefined,
  kindRaw?: string,
  notes?: string,
) {
  const normalizedTitle = title?.trim();
  const normalizedDate = normalizeDateTime(scheduledAtRaw);
  const normalizedKind = normalizeKind(kindRaw);

  if (!normalizedTitle || !normalizedDate || !supportedKinds.has(normalizedKind)) {
    return null;
  }

  return {
    title: normalizedTitle,
    scheduledAt: normalizedDate,
    kind: normalizedKind,
    notes: notes?.trim() ? notes.trim() : undefined,
  } satisfies ImportedScheduleItemInput;
}

function parseJsonPayload(raw: string): ScheduleImportResult {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : [];
    const accepted = list
      .map<ImportedScheduleItemInput | null>((item) =>
        buildAcceptedItem(
          item?.title,
          item?.scheduledAt ?? item?.date ?? item?.datetime,
          item?.kind,
          item?.notes,
        ),
      )
      .filter((item): item is ImportedScheduleItemInput => item !== null);

    const rejectedCount = list.length - accepted.length;

    return {
      accepted,
      rejected:
        rejectedCount > 0
          ? [`${rejectedCount} row${rejectedCount === 1 ? "" : "s"} could not be imported`]
          : [],
    };
  } catch {
    return {
      accepted: [],
      rejected: ["The JSON file could not be parsed"],
    };
  }
}

function parseDelimitedText(raw: string): ScheduleImportResult {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      accepted: [],
      rejected: ["The file was empty"],
    };
  }

  const accepted: ImportedScheduleItemInput[] = [];
  const rejected: string[] = [];

  for (const [index, line] of lines.entries()) {
    if (line.toLowerCase().startsWith("title,")) {
      continue;
    }

    const parts = line.includes("|") ? line.split("|").map((part) => part.trim()) : parseCsvLine(line);
    const item = buildAcceptedItem(parts[0], parts[1], parts[2], parts[3]);

    if (!item) {
      rejected.push(`Line ${index + 1} could not be imported`);
      continue;
    }

    accepted.push(item);
  }

  return { accepted, rejected };
}

export function parseScheduleImportFile(
  filename: string,
  raw: string,
): ScheduleImportResult {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".json")) {
    return parseJsonPayload(raw);
  }

  return parseDelimitedText(raw);
}
