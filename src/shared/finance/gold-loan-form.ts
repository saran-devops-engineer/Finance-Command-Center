import type { GoldInterestPaymentType, Loan } from "@/shared/domain/finance";
import { addCalendarMonths } from "@/shared/finance/home-loan-calculations";
import { computeGoldNextDueDate } from "@/shared/finance/gold-loan-calculations";
import { toNumber } from "@/shared/finance/loan-form";

export function isGoldLoan(loan: Loan): boolean {
  return loan.type === "gold";
}

export function hasGoldLoanV1Fields(loan: Loan): boolean {
  return Boolean(loan.goldInterestPaymentType && loan.renewalDate && loan.loanStartDate);
}

export interface GoldLoanFormState {
  name: string;
  type: "gold";
  lender: string;
  originalAmount: string;
  outstandingBalance: string;
  annualInterestRate: string;
  loanStartDate: string;
  renewalDate: string;
  goldInterestPaymentType: GoldInterestPaymentType;
  goldWeightGrams: string;
}

export const initialGoldLoanFormState: GoldLoanFormState = {
  name: "",
  type: "gold",
  lender: "",
  originalAmount: "",
  outstandingBalance: "",
  annualInterestRate: "",
  loanStartDate: "",
  renewalDate: "",
  goldInterestPaymentType: "monthly",
  goldWeightGrams: ""
};

export function goldLoanToFormState(loan: Loan): GoldLoanFormState {
  return {
    name: loan.name,
    type: "gold",
    lender: loan.lender,
    originalAmount: String(loan.originalAmount),
    outstandingBalance: String(loan.outstandingBalance),
    annualInterestRate: String(loan.annualInterestRate),
    loanStartDate: loan.loanStartDate ?? "",
    renewalDate: loan.renewalDate ?? "",
    goldInterestPaymentType: loan.goldInterestPaymentType ?? "monthly",
    goldWeightGrams:
      typeof loan.goldWeightGrams === "number" ? String(loan.goldWeightGrams) : ""
  };
}

export function validateGoldLoanForm(form: GoldLoanFormState) {
  const errors: string[] = [];
  const originalAmount = toNumber(form.originalAmount);
  const outstandingBalance = toNumber(form.outstandingBalance);
  const annualInterestRate = toNumber(form.annualInterestRate);
  const goldWeightGrams = form.goldWeightGrams.trim() ? toNumber(form.goldWeightGrams) : 0;

  if (!form.name.trim()) {
    errors.push("Loan name is required.");
  }

  if (!form.lender.trim()) {
    errors.push("Lender name is required.");
  }

  if (originalAmount <= 0) {
    errors.push("Loan amount must be greater than 0.");
  }

  if (outstandingBalance <= 0) {
    errors.push("Outstanding principal must be greater than 0.");
  }

  if (outstandingBalance > originalAmount) {
    errors.push("Outstanding principal cannot exceed the loan amount.");
  }

  if (annualInterestRate <= 0) {
    errors.push("Interest rate must be greater than 0.");
  }

  if (!form.loanStartDate) {
    errors.push("Loan start date is required.");
  }

  if (!form.renewalDate) {
    errors.push("Renewal date is required.");
  }

  if (form.loanStartDate && form.renewalDate && form.renewalDate <= form.loanStartDate) {
    errors.push("Renewal date must be after the loan start date.");
  }

  if (goldWeightGrams < 0) {
    errors.push("Gold weight cannot be negative.");
  }

  return errors;
}

export function buildGoldLoanFromForm(form: GoldLoanFormState, existing?: Loan): Loan {
  const originalAmount = toNumber(form.originalAmount);
  const outstandingBalance = toNumber(form.outstandingBalance);
  const annualInterestRate = toNumber(form.annualInterestRate);
  const goldWeightGrams = form.goldWeightGrams.trim()
    ? toNumber(form.goldWeightGrams)
    : undefined;
  const principalPaid = Math.max(originalAmount - outstandingBalance, 0);
  const nextDueDate = computeGoldNextDueDate(
    form.goldInterestPaymentType,
    form.loanStartDate,
    form.renewalDate
  );

  return {
    id: existing?.id ?? `loan-${crypto.randomUUID()}`,
    name: form.name.trim(),
    type: "gold",
    lender: form.lender.trim(),
    originalAmount,
    outstandingBalance,
    annualInterestRate,
    // Gold loans are interest-based: no EMI, no tenure.
    monthlyEmi: 0,
    principalPaid,
    interestPaid: existing?.interestPaid ?? 0,
    remainingTenureMonths: 0,
    estimatedClosureDate: form.renewalDate,
    nextDueDate,
    loanStartDate: form.loanStartDate,
    renewalDate: form.renewalDate,
    goldInterestPaymentType: form.goldInterestPaymentType,
    goldWeightGrams,
    notes: existing?.notes,
    status: existing?.status ?? "active",
    archivedAt: existing?.archivedAt,
    archiveReason: existing?.archiveReason,
    deletedAt: existing?.deletedAt,
    isOverdue: existing?.isOverdue
  };
}

/**
 * Recompute derived fields for a gold loan (principal paid, next due date).
 * Keeps the persisted record consistent on every read/write.
 */
export function applyGoldLoanDerivedFields(loan: Loan): Loan {
  if (!isGoldLoan(loan)) {
    return loan;
  }

  const interestType = loan.goldInterestPaymentType ?? "monthly";
  const loanStartDate = loan.loanStartDate ?? loan.nextDueDate ?? "";
  const renewalDate = loan.renewalDate ?? "";

  return {
    ...loan,
    monthlyEmi: 0,
    remainingTenureMonths: 0,
    principalPaid: Math.max(loan.originalAmount - loan.outstandingBalance, 0),
    estimatedClosureDate: renewalDate || loan.estimatedClosureDate || "",
    nextDueDate: computeGoldNextDueDate(interestType, loanStartDate, renewalDate)
  };
}

/**
 * Backfill Gold Loan V1 fields for legacy gold loans that predate the model
 * (e.g. old EMI-style gold entries). Defaults to monthly interest and a renewal
 * date one year after the loan start date.
 */
export function migrateGoldLoan(loan: Loan): Loan {
  if (!isGoldLoan(loan)) {
    return loan;
  }

  if (hasGoldLoanV1Fields(loan)) {
    return applyGoldLoanDerivedFields(loan);
  }

  const loanStartDate =
    loan.loanStartDate ??
    (loan.nextDueDate ? loan.nextDueDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const renewalDate = loan.renewalDate ?? addCalendarMonths(loanStartDate, 12);

  return applyGoldLoanDerivedFields({
    ...loan,
    loanStartDate,
    renewalDate,
    goldInterestPaymentType: loan.goldInterestPaymentType ?? "monthly"
  });
}
