/**
 * Keeps V1 MoneyBreakdown fields roughly aligned with manual commitment edits.
 * Product-generated amounts continue to live in loanPayments / fixedCommitments via lifecycles.
 */

import type { FinanceRepository } from "@/core/repository/finance-repository";
import {
  CommitmentCategory,
  CommitmentSourceKind,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

export async function syncManualCommitmentsToMoneyBreakdown(
  repository: FinanceRepository
): Promise<void> {
  const [moneyBreakdown, commitments] = await Promise.all([
    repository.getMoneyBreakdown(),
    repository.listCommitments()
  ]);

  if (!moneyBreakdown) {
    return;
  }

  const manual = commitments.filter(
    (item) =>
      item.source.kind === CommitmentSourceKind.MANUAL ||
      item.source.kind === CommitmentSourceKind.LEGACY_MIGRATED
  );

  const sumBy = (predicate: (item: CommitmentRecord) => boolean) =>
    manual.filter(predicate).reduce((sum, item) => sum + Math.max(item.amount, 0), 0);

  await repository.saveMoneyBreakdown({
    ...moneyBreakdown,
    rent: sumBy((item) => item.category === CommitmentCategory.RENT),
    utilityBills: sumBy((item) => item.category === CommitmentCategory.UTILITY),
    mandatoryExpenses: sumBy((item) => item.category === CommitmentCategory.MANUAL_EXPENSE),
    // Keep product-driven loanPayments; only overwrite insurance/emis from legacy+manual if present.
    insurance: sumBy((item) => item.category === CommitmentCategory.INSURANCE_PREMIUM),
    emis: sumBy(
      (item) =>
        item.category === CommitmentCategory.LOAN_EMI &&
        item.source.kind !== CommitmentSourceKind.PRODUCT_GENERATED
    ),
    fixedCommitments: sumBy(
      (item) =>
        item.category === CommitmentCategory.SUBSCRIPTION ||
        item.category === CommitmentCategory.OTHER ||
        item.category === CommitmentCategory.SCHOOL_FEES ||
        item.category === CommitmentCategory.TAX
    )
  });
}
