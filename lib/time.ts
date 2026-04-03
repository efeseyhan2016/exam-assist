import { StudentConstraints, StudySession } from "@/lib/types";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function setTime(date: Date, hour: number, minute = 0) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
  );
}

export function getTodayKey(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isSameCalendarDay(left: Date, right: Date) {
  return getTodayKey(left) === getTodayKey(right);
}

export function getHoursBetween(later: Date, earlier: Date) {
  return Math.max((later.getTime() - earlier.getTime()) / HOUR, 0);
}

export function getMinutesBetween(later: Date, earlier: Date) {
  return Math.max((later.getTime() - earlier.getTime()) / MINUTE, 0);
}

export function formatExamDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatHourValue(hours: number) {
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function formatStudyHours(hours: number) {
  if (hours === 0) {
    return "0h";
  }

  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

export function formatPlannedHours(hours: number) {
  const rounded = Math.round(hours * 2) / 2;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)}h` : `${rounded.toFixed(1)}h`;
}

export function formatApproxHours(hours: number) {
  if (hours <= 0.5) {
    return "<1h";
  }

  return `~${Math.round(hours)}h`;
}

export function formatMinutesAsHours(minutes: number) {
  return formatStudyHours(minutes / 60);
}

export function formatRelativeDuration(totalMilliseconds: number) {
  const safe = Math.max(totalMilliseconds, 0);
  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function getCountdownParts(target: Date, now: Date) {
  const distance = Math.max(target.getTime() - now.getTime(), 0);
  const totalSeconds = Math.floor(distance / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    totalMilliseconds: distance,
  };
}

export function sumSessionsForToday(sessions: StudySession[], reference: Date) {
  const todayKey = getTodayKey(reference);

  return sessions
    .filter((session) => getTodayKey(new Date(session.createdAt)) === todayKey)
    .reduce((total, session) => total + session.minutes, 0);
}

export function sumHoursForSubject(
  sessions: StudySession[],
  subjectId: StudySession["subjectId"],
) {
  return (
    sessions
      .filter((session) => session.subjectId === subjectId)
      .reduce((total, session) => total + session.minutes, 0) / 60
  );
}

export function isMorningExam(examDate: Date) {
  return examDate.getHours() < 12;
}

function getStudyWindowEnd(
  day: Date,
  examDate: Date,
  constraints: StudentConstraints,
) {
  if (isSameCalendarDay(day, examDate)) {
    return new Date(examDate.getTime() - constraints.wakeBufferMinutes * MINUTE);
  }

  const nextDay = addDays(day, 1);
  if (isSameCalendarDay(nextDay, examDate) && isMorningExam(examDate)) {
    return setTime(nextDay, constraints.morningSleepCutoffHour);
  }

  return setTime(day, constraints.standardStudyDayEndHour);
}

export function estimateEffectiveStudyHoursLeft(
  now: Date,
  examDate: Date,
  constraints: StudentConstraints,
) {
  if (examDate.getTime() <= now.getTime()) {
    return 0;
  }

  let total = 0;
  let cursor = getStartOfDay(now);
  const examDay = getStartOfDay(examDate);

  while (cursor.getTime() <= examDay.getTime()) {
    const windowStart = setTime(cursor, constraints.studyDayStartHour);
    const windowEnd = getStudyWindowEnd(cursor, examDate, constraints);
    const actualStart =
      isSameCalendarDay(cursor, now) && now.getTime() > windowStart.getTime()
        ? now
        : windowStart;

    const usableHours = getHoursBetween(windowEnd, actualStart);
    total += Math.min(constraints.dailyStudyGoalHours, usableHours);
    cursor = addDays(cursor, 1);
  }

  return Number(total.toFixed(2));
}
