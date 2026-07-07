import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { getPinnedLoanId, setPinnedLoanId } from "@/lib/pinned-loan";
import { isActiveLoan, normalizeLoan } from "@/lib/loan-status";
import type { FinanceRepository } from "@/repositories/finance-repository";
import { buildLoanDue } from "@/shared/finance/loan-form";
import type { Loan } from "@/shared/domain/finance";

export async function syncLoanCommitments(
  repository: FinanceRepository,
  previousLoan: Loan | null,
  nextLoan: Loan
) {
  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (moneyBreakdown) {
    const previousEmi = previousLoan?.monthlyEmi ?? 0;
    const nextEmi = nextLoan.monthlyEmi;
    const adjustedLoanPayments = Math.max(
      moneyBreakdown.loanPayments - previousEmi + nextEmi,
      0
    );

    await repository.saveMoneyBreakdown({
      ...moneyBreakdown,
      loanPayments: adjustedLoanPayments
    });
  }

  await repository.saveUpcomingDue(buildLoanDue(nextLoan));
}

export async function saveLoanUpdate(
  repository: FinanceRepository,
  previousLoan: Loan,
  nextLoan: Loan
) {
  await repository.saveLoan(normalizeLoan(nextLoan));
  await syncLoanCommitments(repository, previousLoan, nextLoan);
  notifyFinanceDataUpdated("loan");
}

export async function softDeleteLoanRecord(
  repository: FinanceRepository,
  loanId: string
) {
  const loan = await repository.getLoan(loanId);

  if (!loan || !isActiveLoan(loan)) {
    return false;
  }

  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (moneyBreakdown) {
    await repository.saveMoneyBreakdown({
      ...moneyBreakdown,
      loanPayments: Math.max(moneyBreakdown.loanPayments - loan.monthlyEmi, 0)
    });
  }

  await repository.deleteUpcomingDue(`due-${loan.id}`);
  await repository.softDeleteLoan(loan.id);

  if (getPinnedLoanId() === loan.id) {
    setPinnedLoanId(null);
  }

  notifyFinanceDataUpdated("loan");
  return true;
}

export async function archiveLoanRecord(
  repository: FinanceRepository,
  loanId: string,
  archiveReason?: string
) {
  const loan = await repository.getLoan(loanId);

  if (!loan || !isActiveLoan(loan)) {
    return false;
  }

  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (moneyBreakdown) {
    await repository.saveMoneyBreakdown({
      ...moneyBreakdown,
      loanPayments: Math.max(moneyBreakdown.loanPayments - loan.monthlyEmi, 0)
    });
  }

  await repository.deleteUpcomingDue(`due-${loan.id}`);
  await repository.archiveLoan(loan.id, archiveReason);

  if (getPinnedLoanId() === loan.id) {
    setPinnedLoanId(null);
  }

  notifyFinanceDataUpdated("loan");
  return true;
}
