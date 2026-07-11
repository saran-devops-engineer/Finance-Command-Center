import type { CommitmentStatus } from "@/engines/commitment/types";

export const COMMITMENT_DUE_SOON_DAYS = 7;

export function getDaysUntil(date: string, referenceDate?: string) {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);
  const today = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function resolveCommitmentStatus(
  dueDate: string,
  referenceDate?: string
): CommitmentStatus {
  const daysUntil = getDaysUntil(dueDate, referenceDate);

  if (daysUntil <= COMMITMENT_DUE_SOON_DAYS) {
    return "due-soon";
  }

  return "upcoming";
}

export function calendarMonthsUntil(dueDate: string, referenceDate?: string) {
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const today = referenceDate
    ? new Date(`${referenceDate.slice(0, 10)}T00:00:00`)
    : new Date();

  const months =
    (due.getFullYear() - today.getFullYear()) * 12 + (due.getMonth() - today.getMonth());

  return Math.max(1, months);
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameCalendarMonth(first: string, second: Date) {
  const due = new Date(`${first.slice(0, 10)}T00:00:00`);
  return due.getFullYear() === second.getFullYear() && due.getMonth() === second.getMonth();
}

export function isNextCalendarMonth(dueDate: string, reference: Date) {
  const due = new Date(`${dueDate.slice(0, 10)}T00:00:00`);
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  return due.getFullYear() === nextMonth.getFullYear() && due.getMonth() === nextMonth.getMonth();
}
