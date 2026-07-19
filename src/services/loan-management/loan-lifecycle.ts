import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { getPinnedLoanId, setPinnedLoanId } from "@/lib/pinned-loan";
import { isActiveLoan, normalizeLoan } from "@/lib/loan-status";
import type { FinanceRepository } from "@/repositories";
import { buildLoanDue, getLoanMonthlyCommitment } from "@/shared/finance/loan-form";
import type { Loan } from "@/shared/domain/finance";
import { syncProductGeneratedCommitments } from "@/services/commitment-sync/sync-product-commitments";

export async function syncLoanCommitments(
  repository: FinanceRepository,
  previousLoan: Loan | null,
  nextLoan: Loan
) {
  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (moneyBreakdown) {
    const previousCommitment = previousLoan ? getLoanMonthlyCommitment(previousLoan) : 0;
    const nextCommitment = getLoanMonthlyCommitment(nextLoan);
    const adjustedLoanPayments = Math.max(
      moneyBreakdown.loanPayments - previousCommitment + nextCommitment,
      0
    );

    await repository.saveMoneyBreakdown({
      ...moneyBreakdown,
      loanPayments: adjustedLoanPayments
    });
  }

  await repository.saveUpcomingDue(buildLoanDue(nextLoan));
  await syncProductGeneratedCommitments(repository);
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

export async function softDeleteLoanRecord(repository: FinanceRepository, loanId: string) {
  const loan = await repository.getLoan(loanId);

  if (!loan || !isActiveLoan(loan)) {
    return false;
  }

  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (moneyBreakdown) {
    await repository.saveMoneyBreakdown({
      ...moneyBreakdown,
      loanPayments: Math.max(moneyBreakdown.loanPayments - getLoanMonthlyCommitment(loan), 0)
    });
  }

  await repository.deleteUpcomingDue(`due-${loan.id}`);
  await repository.softDeleteLoan(loan.id);
  await syncProductGeneratedCommitments(repository);

  if ((await getPinnedLoanId()) === loan.id) {
    await setPinnedLoanId(null);
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
      loanPayments: Math.max(moneyBreakdown.loanPayments - getLoanMonthlyCommitment(loan), 0)
    });
  }

  await repository.deleteUpcomingDue(`due-${loan.id}`);
  await repository.archiveLoan(loan.id, archiveReason);
  await syncProductGeneratedCommitments(repository);

  if ((await getPinnedLoanId()) === loan.id) {
    await setPinnedLoanId(null);
  }

  notifyFinanceDataUpdated("loan");
  return true;
}
