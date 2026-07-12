import { notifyFinanceDataUpdated } from "@/lib/finance-data-events";
import { isActiveChit, normalizeChit } from "@/lib/chit-status";
import type { FinanceRepository } from "@/repositories";
import { getChitMonthlyCashFlowAmount } from "@/shared/finance/chit-calculations";
import type { Chit } from "@/shared/domain/chit";

async function syncChitCashFlow(
  repository: FinanceRepository,
  previousChit: Chit | null,
  nextChit: Chit
) {
  const moneyBreakdown = await repository.getMoneyBreakdown();

  if (!moneyBreakdown) {
    return;
  }

  const previousAmount = previousChit ? getChitMonthlyCashFlowAmount(previousChit) : 0;
  const nextAmount = getChitMonthlyCashFlowAmount(nextChit);

  await repository.saveMoneyBreakdown({
    ...moneyBreakdown,
    fixedCommitments: Math.max(
      moneyBreakdown.fixedCommitments - previousAmount + nextAmount,
      0
    )
  });
}

export async function saveChitUpdate(
  repository: FinanceRepository,
  previousChit: Chit | null,
  nextChit: Chit
) {
  await repository.saveChit(normalizeChit(nextChit));
  await syncChitCashFlow(repository, previousChit, nextChit);
  notifyFinanceDataUpdated("chit");
}

export async function archiveChitRecord(
  repository: FinanceRepository,
  chitId: string,
  archiveReason?: string
) {
  const chit = await repository.getChit(chitId);

  if (!chit || !isActiveChit(chit)) {
    return false;
  }

  await syncChitCashFlow(repository, chit, {
    ...chit,
    status: "archived"
  });

  await repository.archiveChit(chitId, archiveReason);
  notifyFinanceDataUpdated("chit");
  return true;
}

export async function softDeleteChitRecord(repository: FinanceRepository, chitId: string) {
  const chit = await repository.getChit(chitId);

  if (!chit || !isActiveChit(chit)) {
    return false;
  }

  await syncChitCashFlow(repository, chit, {
    ...chit,
    status: "deleted"
  });

  await repository.softDeleteChit(chitId);
  notifyFinanceDataUpdated("chit");
  return true;
}
