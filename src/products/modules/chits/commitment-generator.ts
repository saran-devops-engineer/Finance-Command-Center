import type { Chit } from "@/shared/domain/chit";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind
} from "@/shared/domain/commitment-record";
import { ProductTypeId } from "@/shared/domain/product";
import type { ProductCommitmentGenerator } from "@/products/contract";
import { isActiveChit } from "@/lib/chit-status";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";

export const chitsCommitmentGenerator: ProductCommitmentGenerator<Chit> = {
  productTypeId: ProductTypeId.CHITS,

  generateCommitments(chit: Chit): CommitmentRecord[] {
    if (!isActiveChit(chit)) {
      return [];
    }

    const metrics = deriveChitMetrics(chit);
    if (metrics.remainingMonths <= 0 || chit.monthlyContribution <= 0) {
      return [];
    }

    const now = new Date().toISOString();

    return [
      {
        id: `product-chit-${chit.id}`,
        title: `${chit.chitName} contribution`,
        category: CommitmentCategory.CHIT_INSTALLMENT,
        amount: chit.monthlyContribution,
        frequency: CommitmentFrequency.MONTHLY,
        nextDueDate: chit.nextDueDate,
        priority: CommitmentPriority.MEDIUM,
        source: {
          kind: CommitmentSourceKind.PRODUCT_GENERATED,
          productTypeId: ProductTypeId.CHITS,
          productId: chit.id
        },
        reviewStatus: CommitmentReviewStatus.CONFIRMED,
        reminderEnabled: false,
        editable: false,
        notes: `Generated from chit product · ${chit.providerName}`,
        createdAt: now,
        updatedAt: now
      }
    ];
  }
};
