import type { Loan } from "@/shared/domain/finance";
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
import { isActiveLoan } from "@/lib/loan-status";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";

/** Non-gold loans (home, personal, vehicle, etc.) → monthly EMI commitment. */
export const loansCommitmentGenerator: ProductCommitmentGenerator<Loan> = {
  productTypeId: ProductTypeId.LOANS,

  generateCommitments(loan: Loan): CommitmentRecord[] {
    if (!isActiveLoan(loan) || isGoldLoan(loan) || loan.monthlyEmi <= 0) {
      return [];
    }

    const now = new Date().toISOString();

    return [
      {
        id: `product-loan-emi-${loan.id}`,
        title: `${loan.name} EMI`,
        category: CommitmentCategory.LOAN_EMI,
        amount: loan.monthlyEmi,
        frequency: CommitmentFrequency.MONTHLY,
        nextDueDate: loan.nextDueDate,
        priority: CommitmentPriority.HIGH,
        source: {
          kind: CommitmentSourceKind.PRODUCT_GENERATED,
          productTypeId: ProductTypeId.LOANS,
          productId: loan.id
        },
        reviewStatus: CommitmentReviewStatus.CONFIRMED,
        reminderEnabled: false,
        editable: false,
        notes: `Generated from loan product · ${loan.lender}`,
        createdAt: now,
        updatedAt: now
      }
    ];
  }
};
