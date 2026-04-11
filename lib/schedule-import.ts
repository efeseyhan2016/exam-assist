import { extractExamScheduleFromPdf, extractPdfTextLines } from "@/lib/pdf-engine";
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

interface PdfScheduleImportDecisionInput {
  examAccepted: ImportedScheduleItemInput[];
  outlineResult: ScheduleImportResult;
}

const supportedExtensions = [
  ".csv",
  ".json",
  ".txt",
  ".md",
  ".pdf",
  ".docx",
  ".xlsx",
  ".xls",
] as const;

const examKeywords = [
  "exam",
  "sinav",
  "sınav",
  "midterm",
  "final",
  "quiz",
  "vize",
  "finals",
] as const;

const assignmentKeywords = [
  "assignment",
  "homework",
  "odev",
  "ödev",
  "homework",
  "deliverable",
  "submission",
  "teslim",
  "teslimi",
] as const;

const projectKeywords = [
  "project",
  "proje",
  "term project",
  "bitirme",
  "case study",
  "sunum",
  "presentation",
] as const;

const deadlineKeywords = [
  "deadline",
  "due",
  "due date",
  "last date",
  "son tarih",
  "last day",
] as const;

const supportedKindLabels: ScheduleItemKind[] = [
  "exam",
  "deadline",
  "assignment",
  "project",
];

const supportedKinds = new Set<ScheduleItemKind>(supportedKindLabels);

function normalizeKind(raw: string | undefined): ScheduleItemKind {
  const compact = raw?.trim().toLowerCase() ?? "";
  if (!compact) {
    return "exam";
  }

  if (compact === "exam" || compact === "sinav" || compact === "sınav") {
    return "exam";
  }

  if (compact === "assignment" || compact === "homework" || compact === "odev" || compact === "ödev") {
    return "assignment";
  }

  if (compact === "project" || compact === "proje") {
    return "project";
  }

  if (compact === "deadline" || compact === "due" || compact === "son tarih") {
    return "deadline";
  }

  return inferScheduleItemKindFromText(compact);
}

function normalizeTextForKind(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function cleanOutlineMarkers(text: string) {
  return text
    .replace(/^[-*•]+\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^[A-Za-z][.)]\s*/, "")
    .replace(/^#{1,6}\s*/, "")
    .trim();
}

export function inferScheduleItemKindFromText(text: string): ScheduleItemKind {
  const normalized = normalizeTextForKind(text);

  if (includesAnyKeyword(normalized, projectKeywords)) {
    return "project";
  }

  if (includesAnyKeyword(normalized, assignmentKeywords)) {
    return "assignment";
  }

  if (includesAnyKeyword(normalized, deadlineKeywords)) {
    return "deadline";
  }

  if (includesAnyKeyword(normalized, examKeywords)) {
    return "exam";
  }

  return "exam";
}

function normalizeDateTime(raw: string | undefined) {
  if (!raw) {
    return null;
  }

  const compact = raw.trim();
  if (!compact) {
    return null;
  }

  const yearFirstMatch = compact.match(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/,
  );

  if (yearFirstMatch) {
    const [, year, month, day, hours = "0", minutes = "0"] = yearFirstMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const dayFirstMatch = compact.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?$/,
  );

  if (dayFirstMatch) {
    const [, day, month, rawYear, hours = "0", minutes = "0"] = dayFirstMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
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
  const normalizedTitle = cleanOutlineMarkers(title?.trim() ?? "");
  const normalizedDate = normalizeDateTime(scheduledAtRaw);
  const normalizedKind = kindRaw?.trim()
    ? normalizeKind(kindRaw)
    : inferScheduleItemKindFromText(`${normalizedTitle} ${notes ?? ""}`);

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
    const list: unknown[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];
    const accepted = list
      .map<ImportedScheduleItemInput | null>((item) =>
        buildAcceptedItem(
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>).title?.toString() ??
              (item as Record<string, unknown>).name?.toString()
            : undefined,
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>).scheduledAt?.toString() ??
              (item as Record<string, unknown>).date?.toString() ??
              (item as Record<string, unknown>).datetime?.toString()
            : undefined,
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>).kind?.toString() ??
              (item as Record<string, unknown>).type?.toString()
            : undefined,
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>).notes?.toString() ??
              (item as Record<string, unknown>).description?.toString()
            : undefined,
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

function parseNaturalLine(line: string) {
  const normalized = line.replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  const dateMatch = normalized.match(
    /(\d{4}[./-]\d{1,2}[./-]\d{1,2}(?:[ T]\d{1,2}:\d{2})?|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}(?:[ T]\d{1,2}:\d{2})?)/,
  );

  if (!dateMatch || typeof dateMatch.index !== "number") {
    return null;
  }

  const title = normalized
    .slice(0, dateMatch.index)
    .replace(/[|,:-]\s*$/g, "")
    .trim();

  const trailing = normalized.slice(dateMatch.index + dateMatch[0].length).trim();
  const kindRaw = inferScheduleItemKindFromText(`${title} ${trailing}`);
  const notes = trailing
    .replace(/\b(?:exam|deadline|assignment|homework|project|proje|odev|ödev)\b/gi, "")
    .replace(/^[|,:-]\s*/, "")
    .trim();

  return buildAcceptedItem(title, dateMatch[0], kindRaw, notes || undefined);
}

function parseTextLines(raw: string): ScheduleImportResult {
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
    const lower = line.toLowerCase();
    if (
      lower.startsWith("title,") ||
      lower.startsWith("title|") ||
      lower === "title" ||
      lower.includes("date") && lower.includes("title")
    ) {
      continue;
    }

    const parts = line.includes("|")
      ? line.split("|").map((part) => part.trim())
      : line.includes(",")
        ? parseCsvLine(line)
        : [];

    const item =
      parts.length >= 2
        ? buildAcceptedItem(parts[0], parts[1], parts[2], parts[3])
        : parseNaturalLine(line);

    if (!item) {
      rejected.push(`Line ${index + 1} could not be imported`);
      continue;
    }

    accepted.push(item);
  }

  return { accepted, rejected };
}

function normalizeHeader(cell: unknown) {
  return String(cell ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function findHeaderIndex(row: unknown[], aliases: string[]) {
  return row.findIndex((cell) => aliases.includes(normalizeHeader(cell)));
}

function parseSpreadsheetRows(rows: unknown[][]): ScheduleImportResult {
  const nonEmptyRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));

  if (nonEmptyRows.length === 0) {
    return {
      accepted: [],
      rejected: ["The spreadsheet was empty"],
    };
  }

  const accepted: ImportedScheduleItemInput[] = [];
  const rejected: string[] = [];
  const headerRow = nonEmptyRows[0];

  const titleIndex = findHeaderIndex(headerRow, ["title", "subject", "name", "item", "task"]);
  const dateIndex = findHeaderIndex(headerRow, ["date", "datetime", "scheduledat", "time", "due", "dueat"]);
  const kindIndex = findHeaderIndex(headerRow, ["kind", "type", "category", "itemtype"]);
  const notesIndex = findHeaderIndex(headerRow, ["notes", "note", "description", "details", "context"]);

  const hasStructuredHeader = titleIndex !== -1 && dateIndex !== -1;
  const dataRows = hasStructuredHeader ? nonEmptyRows.slice(1) : nonEmptyRows;

  for (const [index, row] of dataRows.entries()) {
    const item = hasStructuredHeader
      ? buildAcceptedItem(
          String(row[titleIndex] ?? ""),
          String(row[dateIndex] ?? ""),
          kindIndex === -1 ? undefined : String(row[kindIndex] ?? ""),
          notesIndex === -1 ? undefined : String(row[notesIndex] ?? ""),
        )
      : buildAcceptedItem(
          String(row[0] ?? ""),
          String(row[1] ?? ""),
          String(row[2] ?? ""),
          String(row[3] ?? ""),
        );

    if (!item) {
      rejected.push(`Row ${index + 1} could not be imported`);
      continue;
    }

    accepted.push(item);
  }

  return { accepted, rejected };
}

async function parseSpreadsheetFile(file: File): Promise<ScheduleImportResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const mergedAccepted: ImportedScheduleItemInput[] = [];
  const mergedRejected: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    }) as unknown[][];

    const result = parseSpreadsheetRows(rows);
    mergedAccepted.push(...result.accepted);
    mergedRejected.push(...result.rejected.map((reason) => `${sheetName}: ${reason}`));
  }

  return {
    accepted: mergedAccepted,
    rejected: mergedRejected,
  };
}

async function parseDocxFile(file: File): Promise<ScheduleImportResult> {
  const mammoth = await import("mammoth");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parseTextLines(result.value);
}

function countNonExamKinds(items: ImportedScheduleItemInput[]) {
  return items.filter((item) => item.kind !== "exam").length;
}

export function choosePdfImportResult({
  examAccepted,
  outlineResult,
}: PdfScheduleImportDecisionInput): ScheduleImportResult {
  if (outlineResult.accepted.length === 0) {
    return examAccepted.length === 0
      ? {
          accepted: [],
          rejected: ["PDF'ten okunabilir tarih bulunamadı. Başka bir format deneyin."],
        }
      : { accepted: examAccepted, rejected: [] };
  }

  if (examAccepted.length === 0) {
    return outlineResult;
  }

  const outlineNonExamCount = countNonExamKinds(outlineResult.accepted);
  if (outlineNonExamCount > 0) {
    return outlineResult;
  }

  if (outlineResult.accepted.length > examAccepted.length) {
    return outlineResult;
  }

  return { accepted: examAccepted, rejected: outlineResult.rejected };
}

async function parsePdfFile(file: File): Promise<ScheduleImportResult> {
  const exams = await extractExamScheduleFromPdf(file);
  const examAccepted: ImportedScheduleItemInput[] = exams.map((exam) => ({
    title: exam.title,
    scheduledAt: exam.scheduledAt,
    kind: "exam" as ScheduleItemKind,
  }));
  const textLines = await extractPdfTextLines(file);
  const outlineResult =
    textLines.length > 0
      ? parseTextLines(textLines.join("\n"))
      : {
          accepted: [],
          rejected: ["PDF metni outline gibi okunamadı."],
        };

  return choosePdfImportResult({
    examAccepted,
    outlineResult,
  });
}

export function getSupportedScheduleImportExtensions() {
  return [...supportedExtensions];
}

export async function parseScheduleImportFile(file: File): Promise<ScheduleImportResult> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".json")) {
    return parseJsonPayload(await file.text());
  }

  if (lower.endsWith(".csv") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    return parseTextLines(await file.text());
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    return parseSpreadsheetFile(file);
  }

  if (lower.endsWith(".docx")) {
    return parseDocxFile(file);
  }

  if (lower.endsWith(".pdf")) {
    return parsePdfFile(file);
  }

  return {
    accepted: [],
    rejected: [
      `Unsupported file type. Use ${supportedExtensions.join(", ")}.`,
    ],
  };
}
