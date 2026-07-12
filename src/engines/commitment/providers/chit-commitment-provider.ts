import type {
  CommitmentBuildContext,
  CommitmentProvider,
  FinancialCommitment
} from "@/engines/commitment/types";
import { resolveCommitmentStatus } from "@/engines/commitment/commitment-utils";
import { isActiveChit } from "@/lib/chit-status";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";

export const chitCommitmentProvider: CommitmentProvider = {
  moduleId: "chit",

  buildCommitments({ chits = [], referenceDate }: CommitmentBuildContext): FinancialCommitment[] {
    return chits
      .filter((chit) => isActiveChit(chit))
      .flatMap((chit) => {
        const metrics = deriveChitMetrics(chit);

        if (metrics.remainingMonths <= 0) {
          return [];
        }

        return [
          {
            id: `commitment-chit-${chit.id}`,
            sourceModule: "chit",
            commitmentType: "monthly-contribution",
            title: `${chit.chitName} contribution`,
            description: `Monthly chit contribution to ${chit.providerName}.`,
            amount: chit.monthlyContribution,
            dueDate: chit.nextDueDate,
            priority: "medium",
            status: resolveCommitmentStatus(chit.nextDueDate, referenceDate),
            chitId: chit.id
          }
        ];
      });
  }
};
