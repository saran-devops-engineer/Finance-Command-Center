import type {
  CommitmentBuildContext,
  CommitmentProvider,
  FinancialCommitment
} from "@/engines/commitment/types";
import { resolveCommitmentStatus } from "@/engines/commitment/commitment-utils";
import { isActiveLoan } from "@/lib/loan-status";

export const homeLoanCommitmentProvider: CommitmentProvider = {
  moduleId: "home-loan",

  buildCommitments({ loans, referenceDate }: CommitmentBuildContext): FinancialCommitment[] {
    return loans
      .filter((loan) => loan.type === "home" && isActiveLoan(loan))
      .map((loan) => ({
        id: `commitment-home-${loan.id}`,
        sourceModule: "home-loan",
        commitmentType: "emi",
        title: `${loan.name} EMI`,
        description: `Home loan EMI due to ${loan.lender}.`,
        amount: loan.monthlyEmi,
        dueDate: loan.nextDueDate,
        priority: "high",
        status: resolveCommitmentStatus(loan.nextDueDate, referenceDate),
        loanId: loan.id
      }));
  }
};
