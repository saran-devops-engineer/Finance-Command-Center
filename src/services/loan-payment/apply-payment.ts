import type { Loan, LoanPayment, LoanPaymentKind } from "@/shared/domain/finance";

export interface ApplyPaymentInput {
  loan: Loan;
  kind: LoanPaymentKind;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paidOn: string;
  note?: string;
}

export interface ApplyPaymentResult {
  updatedLoan: Loan;
  payment: LoanPayment;
}

export function applyLoanPayment(input: ApplyPaymentInput): ApplyPaymentResult {
  const amount = Math.max(input.amount, 0);
  const interestAmount = Math.min(Math.max(input.interestAmount, 0), amount);
  const principalAmount = Math.min(
    Math.max(input.principalAmount, amount - interestAmount),
    input.loan.outstandingBalance
  );
  const updatedOutstanding = Math.max(input.loan.outstandingBalance - principalAmount, 0);

  const updatedLoan: Loan = {
    ...input.loan,
    outstandingBalance: updatedOutstanding,
    principalPaid: input.loan.principalPaid + principalAmount,
    interestPaid: input.loan.interestPaid + interestAmount,
    remainingTenureMonths:
      input.loan.monthlyEmi > 0
        ? Math.ceil(updatedOutstanding / input.loan.monthlyEmi)
        : input.loan.remainingTenureMonths
  };

  const payment: LoanPayment = {
    id: `payment-${crypto.randomUUID()}`,
    loanId: input.loan.id,
    kind: input.kind,
    amount,
    principalAmount,
    interestAmount,
    paidOn: input.paidOn,
    note: input.note?.trim() || undefined
  };

  return { updatedLoan, payment };
}
