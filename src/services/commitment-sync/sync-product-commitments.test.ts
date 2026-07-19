import { describe, expect, it } from "vitest";
import { generateProductCommitments } from "@/services/commitment-sync/sync-product-commitments";
import { CommitmentSourceKind } from "@/shared/domain/commitment-record";
import type { Loan } from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";

function sampleLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: "loan-1",
    name: "Home Loan",
    type: "home",
    lender: "HDFC",
    originalAmount: 4_000_000,
    outstandingBalance: 3_500_000,
    annualInterestRate: 8.5,
    monthlyEmi: 35_000,
    principalPaid: 500_000,
    interestPaid: 100_000,
    remainingTenureMonths: 200,
    estimatedClosureDate: "2040-01-01",
    nextDueDate: "2026-08-05",
    status: "active",
    ...overrides
  };
}

function sampleChit(overrides: Partial<Chit> = {}): Chit {
  return {
    id: "chit-1",
    providerType: "local",
    providerName: "Family",
    chitName: "Family Chit",
    chitValue: 500_000,
    monthlyContribution: 10_000,
    totalDurationMonths: 20,
    startDate: "2025-01-01",
    currentRunningMonth: 5,
    prizeReceived: false,
    nextDueDate: "2026-08-01",
    status: "active",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("generateProductCommitments", () => {
  it("generates EMI commitments for non-gold loans", () => {
    const commitments = generateProductCommitments({
      loans: [sampleLoan()],
      chits: []
    });

    expect(commitments).toHaveLength(1);
    expect(commitments[0]?.source.kind).toBe(CommitmentSourceKind.PRODUCT_GENERATED);
    expect(commitments[0]?.editable).toBe(false);
    expect(commitments[0]?.amount).toBe(35_000);
  });

  it("generates gold interest and chit contribution commitments", () => {
    const commitments = generateProductCommitments({
      loans: [
        sampleLoan({
          id: "gold-1",
          type: "gold",
          name: "Gold Loan",
          goldInterestPaymentType: "monthly",
          monthlyEmi: 0
        })
      ],
      chits: [sampleChit()]
    });

    expect(commitments).toHaveLength(2);
    expect(commitments.every((item) => item.source.kind === CommitmentSourceKind.PRODUCT_GENERATED)).toBe(
      true
    );
  });

  it("skips archived products", () => {
    const commitments = generateProductCommitments({
      loans: [sampleLoan({ status: "archived" })],
      chits: [sampleChit({ status: "archived" })]
    });

    expect(commitments).toHaveLength(0);
  });
});
