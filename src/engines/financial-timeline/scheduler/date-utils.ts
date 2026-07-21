/** Parse YYYY-MM-DD as local calendar date (timezone-safe for scheduling). */
export function parseCalendarDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = parseCalendarDate(isoDate);
  date.setDate(date.getDate() + days);
  return formatCalendarDate(date);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = parseCalendarDate(startIso);
  const end = parseCalendarDate(endIso);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Clamp due day to valid day in target month (handles 28/29/30/31). */
export function resolveDueDate(year: number, monthIndex: number, dueDayOfMonth: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(Math.max(dueDayOfMonth, 1), lastDay);
  return formatCalendarDate(new Date(year, monthIndex, day));
}

export function addMonthsPreservingDueDay(isoDate: string, months: number, dueDayOfMonth: number): string {
  const date = parseCalendarDate(isoDate);
  const targetMonthIndex = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  return resolveDueDate(targetYear, normalizedMonth, dueDayOfMonth);
}

export function compareCalendarDates(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
