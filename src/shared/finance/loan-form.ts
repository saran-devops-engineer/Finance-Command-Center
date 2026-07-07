import type { Loan, LoanType } from "@/shared/domain/finance";

export interface LoanFormState {
  name: string;
  type: LoanType;
  customTypeName: string;
  lender: string;
  originalAmount: string;
  outstandingBalance: string;
  annualInterestRate: string;
  monthlyEmi: string;
  remainingTenureMonths: string;
  nextDueDate: string;
  notes: string;
}

export const loanTypeOptions: Array<{ value: LoanType; label: string }> = [
  { value: "home", label: "Home Loan" },
  { value: "gold", label: "Gold Loan" },
  { value: "personal", label: "Personal Loan" },
  { value: "vehicle", label: "Vehicle Loan" },
  { value: "education", label: "Education Loan" },
  { value: "credit-card-emi", label: "Credit Card EMI" },
  { value: "consumer-emi", label: "Consumer EMI" },
  { value: "friends-family", label: "Friends / Family" },
  { value: "custom", label: "Custom" },
  { value: "other", label: "Other" }
];

export function toNumber(value: string) {
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function loanToFormState(loan: Loan): LoanFormState {
  return {
    name: loan.name,
    type: loan.type,
    customTypeName: loan.customTypeName ?? "",
    lender: loan.lender,
    originalAmount: String(loan.originalAmount),
    outstandingBalance: String(loan.outstandingBalance),
    annualInterestRate: String(loan.annualInterestRate),
    monthlyEmi: String(loan.monthlyEmi),
    remainingTenureMonths: String(loan.remainingTenureMonths),
    nextDueDate: loan.nextDueDate,
    notes: loan.notes ?? ""
  };
}

export function validateLoanForm(form: LoanFormState) {
  const errors: string[] = [];
  const outstandingBalance = toNumber(form.outstandingBalance);
  const originalAmount = toNumber(form.originalAmount) || outstandingBalance;
  const annualInterestRate = toNumber(form.annualInterestRate);
  const monthlyEmi = toNumber(form.monthlyEmi);
  const remainingTenureMonths = toNumber(form.remainingTenureMonths);

  if (!form.name.trim()) {
    errors.push("Loan name is required.");
  }

  if (annualInterestRate <= 0) {
    errors.push("Interest rate must be greater than 0.");
  }

  if (outstandingBalance < 0) {
    errors.push("Outstanding balance cannot be negative.");
  }

  if (monthlyEmi <= 0) {
    errors.push("EMI must be greater than 0.");
  }

  if (remainingTenureMonths < 0) {
    errors.push("Remaining tenure cannot be negative.");
  }

  if (outstandingBalance > originalAmount) {
    errors.push("Outstanding balance cannot exceed the original principal.");
  }

  return errors;
}

export function buildLoanFromForm(form: LoanFormState, existing?: Loan): Loan {
  const outstandingBalance = toNumber(form.outstandingBalance);
  const originalAmount = toNumber(form.originalAmount) || outstandingBalance;
  const monthlyEmi = toNumber(form.monthlyEmi);
  const remainingTenureMonthsInput = toNumber(form.remainingTenureMonths);
  const principalPaid = Math.max(originalAmount - outstandingBalance, 0);

  return {
    id: existing?.id ?? `loan-${crypto.randomUUID()}`,
    name: form.name.trim(),
    type: form.type,
    customTypeName: form.type === "custom" ? form.customTypeName.trim() : undefined,
    lender: form.lender.trim() || "Manual entry",
    originalAmount,
    outstandingBalance,
    annualInterestRate: toNumber(form.annualInterestRate),
    monthlyEmi,
    principalPaid,
    interestPaid: existing?.interestPaid ?? 0,
    remainingTenureMonths:
      remainingTenureMonthsInput > 0
        ? remainingTenureMonthsInput
        : monthlyEmi > 0
          ? Math.ceil(outstandingBalance / monthlyEmi)
          : 0,
    estimatedClosureDate: existing?.estimatedClosureDate ?? "",
    nextDueDate: form.nextDueDate || new Date().toISOString().slice(0, 10),
    notes: form.notes.trim() || undefined,
    status: existing?.status ?? "active",
    archivedAt: existing?.archivedAt,
    archiveReason: existing?.archiveReason,
    deletedAt: existing?.deletedAt,
    isOverdue: existing?.isOverdue
  };
}

export function buildLoanDue(loan: Loan) {
  return {
    id: `due-${loan.id}`,
    title: `${loan.name} EMI`,
    dueDate: loan.nextDueDate,
    amount: loan.monthlyEmi,
    source: "loan" as const
  };
}
