import { addCalendarMonths } from "@/shared/finance/home-loan-calculations";

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function resolveFirstPaymentDate(asOfDate: string, emiPaymentDay: number): string {
  const reference = new Date(`${asOfDate.slice(0, 10)}T00:00:00`);
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

export function paymentDateForMonth(
  firstPaymentDate: string,
  monthIndex: number,
  emiPaymentDay: number
): string {
  const base = addCalendarMonths(firstPaymentDate, monthIndex);
  const date = new Date(`${base.slice(0, 10)}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = Math.min(emiPaymentDay, daysInMonth(year, month));
  return new Date(year, month, day).toISOString().slice(0, 10);
}
