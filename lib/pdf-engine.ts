import { ContentTypeHint, ResourceItem } from "@/lib/types";

// Lazy-loaded so Next.js doesn't try to SSR it
let pdfjsPromise: Promise<typeof import("pdfjs-dist/legacy/webpack.mjs")> | null = null;

async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/webpack.mjs");
  }
  return pdfjsPromise;
}

async function loadPdfDocument(file: File) {
  const pdfjs = await getPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = (pdfjs as typeof pdfjs & {
    getDocument: (source: {
      data: Uint8Array;
    }) => {
      promise: Promise<{
        numPages: number;
        getPage: (pageNumber: number) => Promise<{
          getTextContent: () => Promise<{ items: unknown[] }>;
        }>;
        destroy: () => Promise<void>;
      }>;
    };
  }).getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  return loadingTask.promise;
}

// ─── Content Fingerprinting ───────────────────────────────────────────────────

const MATH_UNICODE = /[∫∑∏√∂∇∞≤≥≠≈±×÷→←↔⊂⊃∩∪∈∉αβγδεζηθλμπρστφψω]/g;
const OPERATOR_SEQUENCES = /[=<>+\-*/^|\\]{2,}/g;
const MATH_EXPRESSIONS = /\d+\s*[=+\-×÷*/^]\s*\d/g;

/**
 * Samples the first 4 pages of a PDF and estimates whether the content is
 * formula-heavy (math/science), prose-heavy (humanities), or mixed.
 *
 * Returns "unknown" when text extraction fails (e.g. scanned PDFs).
 */
export async function analyzeContentFingerprint(file: File): Promise<ContentTypeHint> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "unknown";
  }

  try {
    const doc = await loadPdfDocument(file);

    const pagesToSample = Math.min(doc.numPages, 4);
    let totalChars = 0;
    let formulaScore = 0;

    for (let i = 1; i <= pagesToSample; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: unknown) =>
          typeof item === "object" && item !== null && "str" in item
            ? (item as { str: string }).str
            : "",
        )
        .join(" ");

      totalChars += text.length;

      // Unicode math symbols carry strong signal
      const mathSymbols = text.match(MATH_UNICODE) ?? [];
      formulaScore += mathSymbols.length * 3;

      // Consecutive operator sequences (e.g. ">=", "**", "->")
      const operators = text.match(OPERATOR_SEQUENCES) ?? [];
      formulaScore += operators.length * 2;

      // Digit sandwiched by operator (e.g. "3 + 4", "x = 5")
      const expressions = text.match(MATH_EXPRESSIONS) ?? [];
      formulaScore += expressions.length * 4;

      // Raw digit density as a weaker formula proxy
      const digits = (text.match(/\d/g) ?? []).length;
      formulaScore += Math.round(digits * 0.4);
    }

    await doc.destroy();

    // Too little text → likely a scanned/image PDF; can't classify
    if (totalChars < 300) return "unknown";

    const ratio = formulaScore / totalChars;
    if (ratio > 0.12) return "formula-heavy";
    if (ratio < 0.04) return "prose-heavy";
    return "mixed";
  } catch {
    return "unknown";
  }
}

export async function extractPdfPageCount(file: File): Promise<number> {
  const doc = await loadPdfDocument(file);
  const count = doc.numPages;
  await doc.destroy();
  return count;
}

export function detectFileType(file: File): "pdf" | "doc" | "other" {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  ) {
    return "doc";
  }
  return "other";
}

// ─── Exam Schedule Extraction ─────────────────────────────────────────────────

export interface ExtractedExam {
  title: string;
  scheduledAt: string; // ISO string
  confidence: "high" | "medium" | "low";
  courseCode?: string;
}

export interface ExamExtractionDebugSummary {
  pageCount: number;
  textItemCount: number;
  totalRows: number;
  rowsWithDate: number;
  rowsWithTime: number;
  rowsWithCourseCandidate: number;
  rowsRejectedNoDate: number;
  rowsRejectedNoTitle: number;
  rowsRejectedTooShort: number;
  rowsRejectedDuplicate: number;
  candidateCount: number;
}

export interface ExamExtractionDebugResult {
  rows: string[][];
  exams: ExtractedExam[];
  debug: ExamExtractionDebugSummary;
}

interface RawTextItem {
  str: string;
  x: number;
  y: number;
}

interface ExtractedRowSnapshot {
  pageCount: number;
  textItemCount: number;
  rows: string[][];
}

/**
 * Extracts text items with their XY positions from all pages.
 * Groups items into logical rows by Y-coordinate proximity.
 * This preserves the table structure of university exam schedule PDFs.
 */
async function extractPositionedRows(
  doc: {
    numPages: number;
    getPage: (pageNumber: number) => Promise<{
      getTextContent: () => Promise<{
        items: unknown[];
      }>;
    }>;
  },
): Promise<ExtractedRowSnapshot> {
  const allRows: string[][] = [];
  let textItemCount = 0;

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    // Collect all text items with positions
    const items: RawTextItem[] = [];
    for (const item of content.items) {
      if (
        typeof item === "object" &&
        item !== null &&
        "str" in item &&
        "transform" in item &&
        Array.isArray((item as { transform: number[] }).transform)
      ) {
        const { str, transform } = item as { str: string; transform: number[] };
        if (!str.trim()) continue;
        // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
        items.push({ str: str.trim(), x: transform[4], y: transform[5] });
      }
    }
    textItemCount += items.length;

    if (items.length === 0) continue;

    // Group by Y-coordinate: items within 4px are on the same visual row
    items.sort((a, b) => b.y - a.y); // top-to-bottom (PDF Y is inverted)
    const rowGroups: RawTextItem[][] = [];
    let currentRow: RawTextItem[] = [];
    let lastY = items[0].y;

    for (const item of items) {
      if (Math.abs(item.y - lastY) <= 4) {
        currentRow.push(item);
      } else {
        if (currentRow.length > 0) rowGroups.push(currentRow);
        currentRow = [item];
        lastY = item.y;
      }
    }
    if (currentRow.length > 0) rowGroups.push(currentRow);

    // Sort each row left-to-right, join with tab separator
    for (const row of rowGroups) {
      row.sort((a, b) => a.x - b.x);
      const cells = mergeAdjacentCells(row);
      if (cells.some((c) => c.trim().length > 0)) {
        allRows.push(cells);
      }
    }
  }

  return {
    pageCount: doc.numPages,
    textItemCount,
    rows: allRows,
  };
}

/** Merge text items that are very close horizontally (same "cell") */
function mergeAdjacentCells(items: RawTextItem[]): string[] {
  if (items.length === 0) return [];
  const cells: string[] = [];
  let current = items[0].str;
  let lastRight = items[0].x + items[0].str.length * 4; // rough width estimate

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const gap = item.x - lastRight;
    if (gap < 12) {
      // Same cell: adjacent text
      current += (gap > 2 ? " " : "") + item.str;
    } else {
      // New cell
      cells.push(current.trim());
      current = item.str;
    }
    lastRight = item.x + item.str.length * 4;
  }
  cells.push(current.trim());
  return cells.filter(Boolean);
}

// ─── Date/Time Patterns ───────────────────────────────────────────────────────

// DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
const DATE_DMY = /\b(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})\b/;
// YYYY-MM-DD (ISO)
const DATE_ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
// Turkish month names: "15 Nisan", "15 Nisan 2026", "15 NİSAN"
const TR_MONTHS: Record<string, number> = {
  ocak: 1, şubat: 2, mart: 3, nisan: 4, mayıs: 5, haziran: 6,
  temmuz: 7, ağustos: 8, eylül: 9, ekim: 10, kasım: 11, aralık: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const DATE_TR_MONTH = new RegExp(
  `\\b(\\d{1,2})\\s+(${Object.keys(TR_MONTHS).join("|")})(?:\\s+(\\d{4}))?\\b`,
  "i",
);
const DATE_WEEKDAY_PAREN_MONTH = new RegExp(
  `\\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|pazartesi|sal[ıi]|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)?\\s*\\(?\\s*(\\d{1,2})\\s+(${Object.keys(TR_MONTHS).join("|")})\\b\\s*\\)?`,
  "i",
);
// Time: HH:MM or HH.MM (optionally followed by -HH:MM for range)
const TIME_PATTERN = /\b([0-1]?\d|2[0-3])[:.h]([0-5]\d)\b/;
// Course code pattern: letters+digits like BUS401, MAT102, ENG201
const COURSE_CODE = /\b[A-ZÇĞİÖŞÜ]{2,5}\s*\d{3,4}\b/i;
const DAY_NAME =
  /\b(pazartesi|sal[ıi]|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
const HEADERISH_CELL =
  /\b(tarih|date|saat|time|gun|gün|yer|room|salon|derslik|class|sube|şube|grade|group|ogrenci|öğrenci|course|course code|course title|course instructor|instructor)\b/i;
const LOCATIONISH_CELL =
  /\b(oda|derslik|salon|room|amfi|lab|laboratuvar|blok)\b/i;

function parseDate(text: string): { day: number; month: number; year: number } | null {
  // Try DD.MM.YYYY first
  const dmy = text.match(DATE_DMY);
  if (dmy) {
    const d = parseInt(dmy[1]), m = parseInt(dmy[2]), y = parseInt(dmy[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }
  // Try ISO
  const iso = text.match(DATE_ISO);
  if (iso) {
    const y = parseInt(iso[1]), m = parseInt(iso[2]), d = parseInt(iso[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }
  // Try Turkish month
  const trm = text.match(DATE_TR_MONTH);
  if (trm) {
    const d = parseInt(trm[1]);
    const monthName = trm[2].toLowerCase().normalize("NFC");
    const m = TR_MONTHS[monthName] ?? TR_MONTHS[monthName.replace(/[^a-z]/g, "")];
    const y = trm[3] ? parseInt(trm[3]) : new Date().getFullYear();
    if (m && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }
  const weekdayMonth = text.match(DATE_WEEKDAY_PAREN_MONTH);
  if (weekdayMonth) {
    const d = parseInt(weekdayMonth[1]);
    const monthName = weekdayMonth[2].toLowerCase().normalize("NFC");
    const m = TR_MONTHS[monthName] ?? TR_MONTHS[monthName.replace(/[^a-z]/g, "")];
    const y = new Date().getFullYear();
    if (m && d >= 1 && d <= 31) return { day: d, month: m, year: y };
  }
  return null;
}

function parseTime(text: string): { hour: number; minute: number } | null {
  const m = text.match(TIME_PATTERN);
  if (!m) return null;
  const h = parseInt(m[1]), min = parseInt(m[2]);
  if (h >= 0 && h <= 23 && min >= 0 && min <= 59) return { hour: h, minute: min };
  return null;
}

function isCourseNameCandidate(text: string): boolean {
  if (text.length < 4 || text.length > 100) return false;
  // Reject pure numbers, pure dates/times
  if (/^\d+$/.test(text)) return false;
  if (DATE_DMY.test(text) && text.length < 15) return false;
  if (HEADERISH_CELL.test(text) || DAY_NAME.test(text) || LOCATIONISH_CELL.test(text)) {
    return false;
  }
  if (/\b(midterm exam program|final exam program|department of|spring term|fall term|exam program)\b/i.test(text)) {
    return false;
  }
  // Must have at least some letters
  if (!/[a-zA-ZÇĞİÖŞÜçğışöşü]{2,}/.test(text)) return false;
  return true;
}

function extractCourseCode(text: string) {
  const match = text.match(COURSE_CODE);
  return match?.[0].replace(/\s+/g, "").toUpperCase() ?? null;
}

function cleanCourseTitle(text: string) {
  return text
    .replace(/\b(oda|derslik|salon|room|amfi|lab|laboratuvar)\b.*/i, "")
    .replace(/\b(pazartesi|sal[ıi]|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 100);
}

function buildCandidateTitle(courseCode: string | null, rawTitle: string) {
  const cleaned = cleanCourseTitle(rawTitle);
  if (!cleaned) {
    return "";
  }

  if (!courseCode) {
    return cleaned;
  }

  if (cleaned.toUpperCase().includes(courseCode)) {
    return cleaned;
  }

  return `${courseCode} ${cleaned}`.trim();
}

function findCourseInfoInRow(row: string[]) {
  const cells = row.filter(
    (cell) =>
      !parseDate(cell) &&
      !parseTime(cell) &&
      !HEADERISH_CELL.test(cell) &&
      !DAY_NAME.test(cell),
  );

  for (const cell of cells) {
    const courseCode = extractCourseCode(cell);
    const withoutCode = courseCode
      ? cell.replace(COURSE_CODE, "").trim()
      : cell;

    if (courseCode && isCourseNameCandidate(withoutCode)) {
      return {
        title: buildCandidateTitle(courseCode, withoutCode),
        courseCode,
        confidence: "high" as const,
      };
    }
  }

  for (let index = 0; index < row.length; index++) {
    const cell = row[index];
    const courseCode = extractCourseCode(cell);
    if (!courseCode) continue;

    const neighbors = [row[index + 1], row[index - 1], row[index + 2], row[index - 2]].filter(
      (value): value is string => Boolean(value),
    );

    const neighborTitle = neighbors.find((neighbor) => {
      if (parseDate(neighbor) || parseTime(neighbor)) return false;
      const withoutCode = neighbor.replace(COURSE_CODE, "").trim();
      return isCourseNameCandidate(withoutCode);
    });

    if (neighborTitle) {
      return {
        title: buildCandidateTitle(courseCode, neighborTitle.replace(COURSE_CODE, "").trim()),
        courseCode,
        confidence: "high" as const,
      };
    }
  }

  const plainTitle = cells.find((cell) => isCourseNameCandidate(cell));
  if (plainTitle) {
    const courseCode = extractCourseCode(plainTitle);
    const titleBody = courseCode
      ? plainTitle.replace(COURSE_CODE, "").trim()
      : plainTitle;

    if (courseCode && titleBody.length < 3) {
      return null;
    }

    return {
      title: buildCandidateTitle(courseCode, titleBody),
      courseCode: courseCode ?? undefined,
      confidence: "medium" as const,
    };
  }

  return null;
}

/**
 * Main schedule extraction. Uses position-aware row data to reconstruct
 * the table structure of university exam PDFs.
 */
export async function extractExamScheduleFromPdf(file: File): Promise<ExtractedExam[]> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return [];
  }

  try {
    const debugResult = await debugExtractExamScheduleFromPdf(file);

    console.debug("[exam-import] extraction summary", {
      fileName: file.name,
      ...debugResult.debug,
    });

    return debugResult.exams;
  } catch (error) {
    console.error("[exam-import] extraction failed", {
      fileName: file.name,
      error,
    });
    return [];
  }
}

export async function debugExtractExamScheduleFromPdf(
  file: File,
): Promise<ExamExtractionDebugResult> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return {
      rows: [],
      exams: [],
      debug: {
        pageCount: 0,
        textItemCount: 0,
        totalRows: 0,
        rowsWithDate: 0,
        rowsWithTime: 0,
        rowsWithCourseCandidate: 0,
        rowsRejectedNoDate: 0,
        rowsRejectedNoTitle: 0,
        rowsRejectedTooShort: 0,
        rowsRejectedDuplicate: 0,
        candidateCount: 0,
      },
    };
  }

  const doc = await loadPdfDocument(file);
  const snapshot = await extractPositionedRows(doc);
  await doc.destroy();
  const rows = snapshot.rows;
  const parsed = parseRowsIntoExamsInternal(rows);

  return {
    rows,
    exams: parsed.exams,
    debug: {
      ...parsed.debug,
      pageCount: snapshot.pageCount,
      textItemCount: snapshot.textItemCount,
    },
  };
}

function parseRowsIntoExamsInternal(rows: string[][]) {
  const results: ExtractedExam[] = [];
  const debug: ExamExtractionDebugSummary = {
    pageCount: 0,
    textItemCount: 0,
    totalRows: rows.length,
    rowsWithDate: 0,
    rowsWithTime: 0,
    rowsWithCourseCandidate: 0,
    rowsRejectedNoDate: 0,
    rowsRejectedNoTitle: 0,
    rowsRejectedTooShort: 0,
    rowsRejectedDuplicate: 0,
    candidateCount: 0,
  };

  // Flatten rows to text lines for contextual fallback
  const flatLines = rows.map((r) => r.join(" "));

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const rowText = row.join(" ");

    // Find a date in this row
    const date = parseDate(rowText);
    if (!date) {
      debug.rowsRejectedNoDate += 1;
      continue;
    }
    debug.rowsWithDate += 1;

    // Find time — prefer same row, then look at adjacent rows
    let time = parseTime(rowText);
    if (!time) {
      for (let offset = 1; offset <= 2; offset++) {
        const adj = flatLines[rowIdx + offset] ?? "";
        const t = parseTime(adj);
        if (t) { time = t; break; }
      }
    }
    if (time) {
      debug.rowsWithTime += 1;
    }
    const hour = time?.hour ?? 9;
    const minute = time?.minute ?? 0;

    let title = "";
    let courseCode: string | undefined;
    let confidence: ExtractedExam["confidence"] = "low";

    const sameRow = findCourseInfoInRow(row);
    if (sameRow) {
      title = sameRow.title;
      courseCode = sameRow.courseCode ?? undefined;
      confidence = sameRow.confidence;
      debug.rowsWithCourseCandidate += 1;
    }

    if (!title || title.length < 4) {
      const rowCourseCode =
        row
          .map((cell) => extractCourseCode(cell))
          .find((value): value is string => Boolean(value)) ?? undefined;

      for (let offset = -2; offset <= 2; offset++) {
        if (offset === 0) continue;
        const adjRow = rows[rowIdx + offset];
        if (!adjRow) continue;
        const adjacent = findCourseInfoInRow(adjRow);
        if (adjacent) {
          title = buildCandidateTitle(
            adjacent.courseCode ?? rowCourseCode ?? null,
            adjacent.title,
          );
          courseCode = adjacent.courseCode ?? rowCourseCode ?? undefined;
          confidence = "low";
          debug.rowsWithCourseCandidate += 1;
          break;
        }
      }
    }

    if (!title) {
      debug.rowsRejectedNoTitle += 1;
      continue;
    }

    title = cleanCourseTitle(title).slice(0, 80);

    if (title.length < 3) {
      debug.rowsRejectedTooShort += 1;
      continue;
    }

    // Deduplicate by title (first 20 chars) + date
    const isoDate = new Date(date.year, date.month - 1, date.day, hour, minute).toISOString();
    const key = `${title.slice(0, 20).toLowerCase()}|${isoDate.slice(0, 10)}`;
    if (results.some((r) =>
      `${r.title.slice(0, 20).toLowerCase()}|${r.scheduledAt.slice(0, 10)}` === key
    )) {
      debug.rowsRejectedDuplicate += 1;
      continue;
    }

    results.push({ title, scheduledAt: isoDate, confidence, courseCode });
  }

  const sorted = results.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  debug.candidateCount = sorted.length;

  return { exams: sorted, debug };
}

export function parseRowsIntoExams(rows: string[][]): ExtractedExam[] {
  return parseRowsIntoExamsInternal(rows).exams;
}

export function debugParseRowsIntoExams(rows: string[][]) {
  return parseRowsIntoExamsInternal(rows);
}

// Average study reading speed: 2 minutes per page
export const MINUTES_PER_PAGE = 2;

export function estimateReadMinutes(pageCount: number): number {
  return pageCount * MINUTES_PER_PAGE;
}

export function formatReadTime(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}s ${m}dk` : `${h} saat`;
}

export interface LibraryAnalysis {
  totalPages: number;
  readPages: number;
  remainingPages: number;
  coveragePercent: number;
  totalReadMinutes: number;
  remainingReadMinutes: number;
  dailyPagesNeeded: number;
  status: "tamamlandi" | "yolunda" | "geri" | "kritik";
}

export function analyzeSubjectLibrary(
  resources: ResourceItem[],
  hoursUntilExam: number,
): LibraryAnalysis {
  const totalPages = resources.reduce((s, r) => s + r.pageCount, 0);
  const readPages = resources.reduce((s, r) => s + r.pagesRead, 0);
  const remainingPages = Math.max(totalPages - readPages, 0);
  const coveragePercent = totalPages > 0 ? Math.round((readPages / totalPages) * 100) : 0;
  const totalReadMinutes = estimateReadMinutes(totalPages);
  const remainingReadMinutes = estimateReadMinutes(remainingPages);
  const daysUntilExam = hoursUntilExam / 24;
  const dailyPagesNeeded =
    daysUntilExam > 0 ? Math.ceil(remainingPages / daysUntilExam) : remainingPages;

  // Available reading time = 30% of available study time
  const availableReadMinutes = hoursUntilExam * 60 * 0.3;
  const ratio = availableReadMinutes > 0 ? remainingReadMinutes / availableReadMinutes : 1;

  let status: LibraryAnalysis["status"];
  if (coveragePercent >= 100) {
    status = "tamamlandi";
  } else if (ratio <= 0.7) {
    status = "yolunda";
  } else if (ratio <= 1.1) {
    status = "geri";
  } else {
    status = "kritik";
  }

  return {
    totalPages,
    readPages,
    remainingPages,
    coveragePercent,
    totalReadMinutes,
    remainingReadMinutes,
    dailyPagesNeeded,
    status,
  };
}
