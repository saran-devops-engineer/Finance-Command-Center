import type {
  CommitmentBuildContext,
  CommitmentProvider,
  FinancialCommitment
} from "@/engines/commitment/types";
import { resolveCommitmentStatus } from "@/engines/commitment/commitment-utils";
import { isActiveLoan } from "@/lib/loan-status";
import {
  computeAnnualInterest,
  computeMonthlyInterestBurden
} from "@/shared/finance/gold-loan-calculations";

export const goldLoanCommitmentProvider: CommitmentProvider = {
  moduleId: "gold-loan",

  buildCommitments({ loans, referenceDate }: CommitmentBuildContext): FinancialCommitment[] {
    return loans
      .filter((loan) => loan.type === "gold" && isActiveLoan(loan))
      .flatMap((loan) => buildGoldLoanCommitments(loan, referenceDate));
  }
};

function buildGoldLoanCommitments(
  loan: CommitmentBuildContext["loans"][number],
  referenceDate?: string
): FinancialCommitment[] {
  if (loan.goldInterestPaymentType === "yearly") {
    const dueDate = loan.renewalDate ?? loan.nextDueDate;

    if (!dueDate) {
      return [];
    }

    return [
      {
        id: `commitment-gold-renewal-${loan.id}`,
        sourceModule: "gold-loan",
        commitmentType: "interest-renewal",
        title: `${loan.name} renewal`,
        description: "Annual gold loan interest payment due on renewal date.",
        amount: Math.round(
          computeAnnualInterest(loan.outstandingBalance, loan.annualInterestRate)
        ),
        dueDate,
        priority: "critical",
        status: resolveCommitmentStatus(dueDate, referenceDate),
        loanId: loan.id
      }
    ];
  }

  return [
    {
      id: `commitment-gold-monthly-${loan.id}`,
      sourceModule: "gold-loan",
      commitmentType: "monthly-interest",
      title: `${loan.name} interest`,
      description: "Monthly gold loan interest payment.",
      amount: Math.round(
        computeMonthlyInterestBurden(loan.outstandingBalance, loan.annualInterestRate)
      ),
      dueDate: loan.nextDueDate,
      priority: "high",
      status: resolveCommitmentStatus(loan.nextDueDate, referenceDate),
      loanId: loan.id
    }
  ];
}
