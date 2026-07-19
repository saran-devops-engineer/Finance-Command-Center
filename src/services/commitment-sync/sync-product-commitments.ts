/**
 * Regenerates product-generated CommitmentRecords while preserving
 * manual and legacy-migrated commitments.
 */

import type { FinanceRepository } from "@/core/repository/finance-repository";
import {
  CommitmentSourceKind,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";
import { loansCommitmentGenerator } from "@/products/modules/loans/commitment-generator";
import { goldLoansCommitmentGenerator } from "@/products/modules/gold-loans/commitment-generator";
import { chitsCommitmentGenerator } from "@/products/modules/chits/commitment-generator";
import { isGoldLoan } from "@/shared/finance/gold-loan-form";

export interface ProductCommitmentSyncResult {
  preservedCount: number;
  generatedCount: number;
  removedProductGeneratedCount: number;
}

export function generateProductCommitments(params: {
  loans: Parameters<typeof loansCommitmentGenerator.generateCommitments>[0][];
  chits: Parameters<typeof chitsCommitmentGenerator.generateCommitments>[0][];
}): CommitmentRecord[] {
  const generated: CommitmentRecord[] = [];

  for (const loan of params.loans) {
    if (isGoldLoan(loan)) {
      generated.push(...goldLoansCommitmentGenerator.generateCommitments(loan));
    } else {
      generated.push(...loansCommitmentGenerator.generateCommitments(loan));
    }
  }

  for (const chit of params.chits) {
    generated.push(...chitsCommitmentGenerator.generateCommitments(chit));
  }

  return generated;
}

export async function syncProductGeneratedCommitments(
  repository: FinanceRepository
): Promise<ProductCommitmentSyncResult> {
  const [existing, loans, chits] = await Promise.all([
    repository.listCommitments(),
    repository.listLoans(),
    repository.listChits()
  ]);

  const preserved = existing.filter(
    (item) => item.source.kind !== CommitmentSourceKind.PRODUCT_GENERATED
  );
  const previousProductGenerated = existing.filter(
    (item) => item.source.kind === CommitmentSourceKind.PRODUCT_GENERATED
  );
  const generated = generateProductCommitments({ loans, chits });

  const nextIds = new Set([...preserved, ...generated].map((item) => item.id));

  for (const item of previousProductGenerated) {
    if (!nextIds.has(item.id)) {
      await repository.deleteCommitment(item.id);
    }
  }

  for (const item of generated) {
    await repository.saveCommitment(item);
  }

  return {
    preservedCount: preserved.length,
    generatedCount: generated.length,
    removedProductGeneratedCount: previousProductGenerated.filter((item) => !nextIds.has(item.id))
      .length
  };
}

export function getProductDetailHref(commitment: CommitmentRecord): string | null {
  const productId = commitment.source.productId;
  const productTypeId = commitment.source.productTypeId;

  if (!productId || !productTypeId) {
    return null;
  }

  if (productTypeId === "chits") {
    return `/chits/${productId}`;
  }

  return `/loans/${productId}`;
}
