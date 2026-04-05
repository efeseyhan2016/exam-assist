/**
 * Generates an iCalendar (.ics) file content from exam dates so users can
 * import their exam schedule into Apple Calendar, Google Calendar, etc.
 *
 * Kept intentionally simple: no recurring events, no reminders, plain VEVENT.
 */

export interface IcsExamInput {
  id: string;
  title: string;
  scheduledAt: string; // ISO 8601
}

/**
 * Formats a Date to the iCalendar datetime format: 20260407T094000Z
 */
function toIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Escapes special characters in iCalendar text values.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Builds the full .ics file content for a list of exams.
 * Each exam becomes a 1-hour VEVENT starting at its scheduled time.
 */
export function buildIcsContent(exams: IcsExamInput[]): string {
  const now = toIcsDateTime(new Date());

  const events = exams
    .map((exam) => {
      const start = new Date(exam.scheduledAt);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

      return [
        "BEGIN:VEVENT",
        `UID:examassist-${exam.id}@examassist`,
        `DTSTAMP:${now}`,
        `DTSTART:${toIcsDateTime(start)}`,
        `DTEND:${toIcsDateTime(end)}`,
        `SUMMARY:${escapeIcsText(exam.title)}`,
        `DESCRIPTION:EXAM ASSIST tarafından oluşturuldu`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EXAM ASSIST//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers a browser download of the .ics file.
 */
export function downloadIcs(exams: IcsExamInput[], filename = "sinav-takvimi.ics"): void {
  const content = buildIcsContent(exams);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
