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
import {
  computeAnnualInterest,
  computeMonthlyInterestBurden
} from "@/shared/finance/gold-loan-calculations";

export const goldLoansCommitmentGenerator: ProductCommitmentGenerator<Loan> = {
  productTypeId: ProductTypeId.GOLD_LOANS,

  generateCommitments(loan: Loan): CommitmentRecord[] {
    if (!isActiveLoan(loan) || !isGoldLoan(loan)) {
      return [];
    }

    const now = new Date().toISOString();

    if (loan.goldInterestPaymentType === "yearly") {
      const dueDate = loan.renewalDate ?? loan.nextDueDate;
      if (!dueDate) {
        return [];
      }

      return [
        {
          id: `product-gold-renewal-${loan.id}`,
          title: `${loan.name} renewal`,
          category: CommitmentCategory.GOLD_RENEWAL,
          amount: Math.round(
            computeAnnualInterest(loan.outstandingBalance, loan.annualInterestRate)
          ),
          frequency: CommitmentFrequency.YEARLY,
          nextDueDate: dueDate,
          priority: CommitmentPriority.CRITICAL,
          source: {
            kind: CommitmentSourceKind.PRODUCT_GENERATED,
            productTypeId: ProductTypeId.GOLD_LOANS,
            productId: loan.id
          },
          reviewStatus: CommitmentReviewStatus.CONFIRMED,
          reminderEnabled: false,
          editable: false,
          notes: "Generated from gold loan product · annual renewal",
          createdAt: now,
          updatedAt: now
        }
      ];
    }

    return [
      {
        id: `product-gold-monthly-${loan.id}`,
        title: `${loan.name} interest`,
        category: CommitmentCategory.GOLD_RENEWAL,
        amount: Math.round(
          computeMonthlyInterestBurden(loan.outstandingBalance, loan.annualInterestRate)
        ),
        frequency: CommitmentFrequency.MONTHLY,
        nextDueDate: loan.nextDueDate,
        priority: CommitmentPriority.HIGH,
        source: {
          kind: CommitmentSourceKind.PRODUCT_GENERATED,
          productTypeId: ProductTypeId.GOLD_LOANS,
          productId: loan.id
        },
        reviewStatus: CommitmentReviewStatus.CONFIRMED,
        reminderEnabled: false,
        editable: false,
        notes: "Generated from gold loan product · monthly interest",
        createdAt: now,
        updatedAt: now
      }
    ];
  }
};
