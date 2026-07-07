export function addCalendarMonths(isoDate: string, monthOffset: number): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  date.setMonth(date.getMonth() + monthOffset);
  return date.toISOString().slice(0, 10);
}

export function monthsBetweenCalendarMonths(startDate: string, endDate: string): number {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`);
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

export function computeOriginalLoanEndDate(
  loanStartDate: string,
  originalLoanTenureMonths: number
): string {
  if (originalLoanTenureMonths <= 0) {
    return loanStartDate.slice(0, 10);
  }

  return addCalendarMonths(loanStartDate, originalLoanTenureMonths);
}

export function computeMonthsElapsed(
  loanStartDate: string,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): number {
  return Math.max(monthsBetweenCalendarMonths(loanStartDate, asOfDate), 0);
}

export function computeEstimatedRemainingTenure(
  originalLoanTenureMonths: number,
  monthsElapsed: number
): number {
  return Math.max(originalLoanTenureMonths - monthsElapsed, 0);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function buildNextDueDateFromPaymentDay(
  emiPaymentDay: number,
  referenceDate: string = new Date().toISOString().slice(0, 10)
): string {
  const reference = new Date(`${referenceDate.slice(0, 10)}T00:00:00`);
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = Math.min(emiPaymentDay, daysInMonth(year, month));
  let due = new Date(year, month, day);

  if (due < reference) {
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const normalizedMonth = nextMonth % 12;
    due = new Date(
      nextYear,
      normalizedMonth,
      Math.min(emiPaymentDay, daysInMonth(nextYear, normalizedMonth))
    );
  }

  return due.toISOString().slice(0, 10);
}

export function buildEstimatedClosureDate(
  remainingTenureMonths: number,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): string {
  if (remainingTenureMonths <= 0) {
    return asOfDate.slice(0, 10);
  }

  return addCalendarMonths(asOfDate, remainingTenureMonths);
}
