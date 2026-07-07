import type { IsoDate, TenureMonths } from "@/engines/loan/home-loan/types/LoanTypes";

export function addMonths(isoDate: string, monthOffset: number): IsoDate {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  date.setMonth(date.getMonth() + monthOffset);
  return date.toISOString().slice(0, 10);
}

export function formatCalendarMonth(asOfDate: string, monthOffset: number) {
  return addMonths(asOfDate, monthOffset).slice(0, 7);
}

export function estimateClosureDate(asOfDate: string, tenureMonths: TenureMonths): IsoDate {
  if (tenureMonths <= 0) {
    return asOfDate.slice(0, 10);
  }

  return addMonths(asOfDate, tenureMonths - 1);
}

/** Zero-based month offset from `asOfDate` to `calendarMonth` (`YYYY-MM`). */
export function monthIndexFromCalendarMonth(asOfDate: string, calendarMonth: string): number {
  const origin = new Date(`${asOfDate.slice(0, 7)}-01T00:00:00`);
  const target = new Date(`${calendarMonth.slice(0, 7)}-01T00:00:00`);
  return (
    (target.getFullYear() - origin.getFullYear()) * 12 +
    (target.getMonth() - origin.getMonth())
  );
}

export function resolveMonthlyExtraMonthWindow(
  asOfDate: string,
  startMonth?: string,
  endMonth?: string,
  startMonthIndex?: number,
  endMonthIndex?: number
): { startMonthIndex: number; endMonthIndex?: number } {
  const resolvedStart =
    startMonth !== undefined
      ? monthIndexFromCalendarMonth(asOfDate, startMonth)
      : (startMonthIndex ?? 0);

  const resolvedEnd =
    endMonth !== undefined
      ? monthIndexFromCalendarMonth(asOfDate, endMonth)
      : endMonthIndex;

  return {
    startMonthIndex: resolvedStart,
    endMonthIndex: resolvedEnd
  };
}
