/**
 * Bridge V2 CommitmentRecords into the V1 FinancialCommitment projection
 * used by Home/Insights engines and UpcomingCommitmentsSection.
 */

import {
  groupFinancialCommitments,
  resolveCommitmentStatus,
  type CommitmentGroup,
  type FinancialCommitment
} from "@/engines/commitment";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import { ProductTypeId } from "@/shared/domain/product";

export function commitmentRecordsToFinancial(
  records: CommitmentRecord[],
  referenceDate?: string
): FinancialCommitment[] {
  return records.map((record) => {
    const productTypeId = record.source.productTypeId;
    const productId = record.source.productId;

    return {
      id: record.id,
      sourceModule: productTypeId ?? record.source.kind,
      commitmentType: record.category,
      title: record.title,
      description: record.notes ?? record.category,
      amount: record.amount,
      dueDate: record.nextDueDate,
      priority: record.priority,
      status: resolveCommitmentStatus(record.nextDueDate, referenceDate),
      loanId:
        productId &&
        (productTypeId === ProductTypeId.LOANS || productTypeId === ProductTypeId.GOLD_LOANS)
          ? productId
          : undefined,
      chitId:
        productId && productTypeId === ProductTypeId.CHITS ? productId : undefined
    };
  });
}

export function groupCommitmentRecordsAsFinancial(
  records: CommitmentRecord[],
  referenceDate?: string
): CommitmentGroup[] {
  return groupFinancialCommitments(
    commitmentRecordsToFinancial(records, referenceDate),
    referenceDate
  );
}
