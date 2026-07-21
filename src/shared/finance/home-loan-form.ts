import type { Loan } from "@/shared/domain/finance";
import {
  addCalendarMonths,
  buildEstimatedClosureDate,
  buildNextDueDateFromPaymentDay,
  computeEstimatedRemainingTenure,
  computeMonthsElapsed,
  computeOriginalLoanEndDate
} from "@/shared/finance/home-loan-calculations";
import { toNumber } from "@/shared/finance/loan-form";

export function isHomeLoan(loan: Pick<Loan, "type">) {
  return loan.type === "home";
}

export function hasHomeLoanV1Fields(loan: Loan) {
  return (
    isHomeLoan(loan) &&
    Boolean(loan.loanStartDate) &&
    typeof loan.originalLoanTenureMonths === "number" &&
    loan.originalLoanTenureMonths > 0 &&
    typeof loan.emiPaymentDay === "number" &&
    loan.emiPaymentDay >= 1 &&
    loan.emiPaymentDay <= 31
  );
}

export interface HomeLoanFormState {
  name: string;
  type: "home";
  lender: string;
  originalAmount: string;
  loanStartDate: string;
  originalLoanTenureMonths: string;
  annualInterestRate: string;
  outstandingBalance: string;
  monthlyEmi: string;
  remainingTenureMonths: string;
  emiPaymentDay: string;
  remainingTenureManuallyOverridden: boolean;
}

export const initialHomeLoanFormState: HomeLoanFormState = {
  name: "",
  type: "home",
  lender: "",
  originalAmount: "",
  loanStartDate: "",
  originalLoanTenureMonths: "",
  annualInterestRate: "",
  outstandingBalance: "",
  monthlyEmi: "",
  remainingTenureMonths: "",
  emiPaymentDay: "1",
  remainingTenureManuallyOverridden: false
};

export function homeLoanToFormState(loan: Loan): HomeLoanFormState {
  return {
    name: loan.name,
    type: "home",
    lender: loan.lender,
    originalAmount: String(loan.originalAmount),
    loanStartDate: loan.loanStartDate ?? "",
    originalLoanTenureMonths: String(loan.originalLoanTenureMonths ?? ""),
    annualInterestRate: String(loan.annualInterestRate),
    outstandingBalance: String(loan.outstandingBalance),
    monthlyEmi: String(loan.monthlyEmi),
    remainingTenureMonths: String(loan.remainingTenureMonths),
    emiPaymentDay: String(loan.emiPaymentDay ?? 1),
    remainingTenureManuallyOverridden: loan.remainingTenureManuallyOverridden ?? false
  };
}

export function validateHomeLoanForm(form: HomeLoanFormState) {
  const errors: string[] = [];
  const originalAmount = toNumber(form.originalAmount);
  const outstandingBalance = toNumber(form.outstandingBalance);
  const annualInterestRate = toNumber(form.annualInterestRate);
  const monthlyEmi = toNumber(form.monthlyEmi);
  const remainingTenureMonths = toNumber(form.remainingTenureMonths);
  const originalLoanTenureMonths = toNumber(form.originalLoanTenureMonths);
  const emiPaymentDay = toNumber(form.emiPaymentDay);
  const today = new Date().toISOString().slice(0, 10);

  if (!form.name.trim()) {
    errors.push("Loan name is required.");
  }

  if (!form.lender.trim()) {
    errors.push("Lender name is required.");
  }

  if (originalAmount <= 0) {
    errors.push("Original loan amount must be greater than 0.");
  }

  if (!form.loanStartDate) {
    errors.push("Loan start date is required.");
  } else if (form.loanStartDate > today) {
    errors.push("Loan start date cannot be in the future.");
  }

  if (originalLoanTenureMonths <= 0) {
    errors.push("Original loan tenure must be greater than 0.");
  }

  if (annualInterestRate <= 0) {
    errors.push("Interest rate must be greater than 0.");
  }

  if (outstandingBalance <= 0) {
    errors.push("Outstanding principal must be greater than 0.");
  }

  if (outstandingBalance > originalAmount) {
    errors.push("Outstanding principal cannot exceed the original loan amount.");
  }

  if (monthlyEmi <= 0) {
    errors.push("Current EMI must be greater than 0.");
  }

  if (remainingTenureMonths <= 0) {
    errors.push("Remaining tenure must be greater than 0.");
  }

  if (originalLoanTenureMonths > 0 && remainingTenureMonths > originalLoanTenureMonths) {
    errors.push("Remaining tenure cannot exceed the original loan tenure.");
  }

  if (emiPaymentDay < 1 || emiPaymentDay > 31) {
    errors.push("EMI payment day must be between 1 and 31.");
  }

  return errors;
}

export function estimateRemainingTenureForForm(form: HomeLoanFormState) {
  const originalLoanTenureMonths = toNumber(form.originalLoanTenureMonths);

  if (!form.loanStartDate || originalLoanTenureMonths <= 0) {
    return 0;
  }

  return computeEstimatedRemainingTenure(
    originalLoanTenureMonths,
    computeMonthsElapsed(form.loanStartDate)
  );
}

export function applyHomeLoanAutoCalculations(
  form: HomeLoanFormState,
  previous: HomeLoanFormState
): HomeLoanFormState {
  const driversChanged =
    form.originalAmount !== previous.originalAmount ||
    form.loanStartDate !== previous.loanStartDate ||
    form.originalLoanTenureMonths !== previous.originalLoanTenureMonths;

  if (!driversChanged || form.remainingTenureManuallyOverridden) {
    return form;
  }

  const estimated = estimateRemainingTenureForForm(form);

  if (estimated <= 0) {
    return form;
  }

  return {
    ...form,
    remainingTenureMonths: String(estimated)
  };
}

export function buildHomeLoanFromForm(form: HomeLoanFormState, existing?: Loan): Loan {
  const originalAmount = toNumber(form.originalAmount);
  const outstandingBalance = toNumber(form.outstandingBalance);
  const monthlyEmi = toNumber(form.monthlyEmi);
  const remainingTenureMonths = toNumber(form.remainingTenureMonths);
  const originalLoanTenureMonths = toNumber(form.originalLoanTenureMonths);
  const emiPaymentDay = toNumber(form.emiPaymentDay);
  const loanStartDate = form.loanStartDate;
  const principalPaid = Math.max(originalAmount - outstandingBalance, 0);
  const estimatedClosureDate = buildEstimatedClosureDate(remainingTenureMonths);
  const nextDueDate = buildNextDueDateFromPaymentDay(emiPaymentDay);

  return {
    id: existing?.id ?? `loan-${crypto.randomUUID()}`,
    name: form.name.trim(),
    type: "home",
    lender: form.lender.trim(),
    originalAmount,
    outstandingBalance,
    annualInterestRate: toNumber(form.annualInterestRate),
    monthlyEmi,
    principalPaid,
    interestPaid: existing?.interestPaid ?? 0,
    remainingTenureMonths,
    estimatedClosureDate,
    nextDueDate,
    loanStartDate,
    originalLoanTenureMonths,
    emiPaymentDay,
    remainingTenureManuallyOverridden: form.remainingTenureManuallyOverridden,
    status: existing?.status ?? "active",
    archivedAt: existing?.archivedAt,
    archiveReason: existing?.archiveReason,
    deletedAt: existing?.deletedAt,
    isOverdue: existing?.isOverdue
  };
}

export function migrateLegacyHomeLoan(loan: Loan): Loan {
  if (!isHomeLoan(loan)) {
    return loan;
  }

  if (hasHomeLoanV1Fields(loan)) {
    return applyHomeLoanDerivedFields(loan);
  }

  const emiPaymentDay = loan.nextDueDate
    ? new Date(`${loan.nextDueDate.slice(0, 10)}T00:00:00`).getDate()
    : 1;
  const originalLoanTenureMonths = Math.max(loan.remainingTenureMonths, 12);
  const today = new Date().toISOString().slice(0, 10);
  let loanStartDate = today;

  if (loan.estimatedClosureDate) {
    loanStartDate = addCalendarMonths(
      loan.estimatedClosureDate,
      -originalLoanTenureMonths
    );
  } else {
    const elapsedEstimate = Math.max(
      originalLoanTenureMonths - loan.remainingTenureMonths,
      0
    );
    loanStartDate = addCalendarMonths(today, -elapsedEstimate);
  }

  return applyHomeLoanDerivedFields({
    ...loan,
    loanStartDate,
    originalLoanTenureMonths,
    emiPaymentDay,
    remainingTenureManuallyOverridden: true
  });
}

export function applyHomeLoanDerivedFields(loan: Loan): Loan {
  if (!isHomeLoan(loan) || !hasHomeLoanV1Fields(loan)) {
    return loan;
  }

  const principalPaid = Math.max(loan.originalAmount - loan.outstandingBalance, 0);
  const estimatedClosureDate = buildEstimatedClosureDate(loan.remainingTenureMonths);
  const nextDueDate = buildNextDueDateFromPaymentDay(loan.emiPaymentDay!);

  return {
    ...loan,
    principalPaid,
    estimatedClosureDate,
    nextDueDate,
    notes: undefined
  };
}

/** Internal-only helper for diagnostics and tests. */
export function getHomeLoanInternalCalculations(loan: Loan) {
  if (!hasHomeLoanV1Fields(loan)) {
    return null;
  }

  return {
    originalLoanEndDate: computeOriginalLoanEndDate(
      loan.loanStartDate!,
      loan.originalLoanTenureMonths!
    ),
    monthsElapsed: computeMonthsElapsed(loan.loanStartDate!),
    estimatedRemainingTenure: computeEstimatedRemainingTenure(
      loan.originalLoanTenureMonths!,
      computeMonthsElapsed(loan.loanStartDate!)
    )
  };
}
