import { describe, expect, it, vi } from "vitest";
import {
  syncProductGeneratedCommitments
} from "@/services/commitment-sync/sync-product-commitments";
import { syncManualCommitmentsToMoneyBreakdown } from "@/services/commitment-sync/sync-manual-to-money";
import type { FinanceRepository } from "@/core/repository/finance-repository";
import type { Loan, MoneyBreakdown } from "@/shared/domain/finance";
import type { Chit } from "@/shared/domain/chit";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

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

function commitment(overrides: Partial<CommitmentRecord>): CommitmentRecord {
  return {
    id: "c1",
    title: "Test",
    category: CommitmentCategory.RENT,
    amount: 20_000,
    frequency: CommitmentFrequency.MONTHLY,
    nextDueDate: "2026-08-01",
    priority: CommitmentPriority.MEDIUM,
    source: { kind: CommitmentSourceKind.MANUAL },
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    reminderEnabled: false,
    editable: true,
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-19T00:00:00.000Z",
    ...overrides
  };
}

function createSyncRepo(params: {
  commitments: CommitmentRecord[];
  loans?: Loan[];
  chits?: Chit[];
  moneyBreakdown?: MoneyBreakdown | null;
}) {
  let commitments = [...params.commitments];
  let moneyBreakdown = params.moneyBreakdown ?? null;
  const saved: CommitmentRecord[] = [];
  const deleted: string[] = [];

  const repository = {
    listCommitments: vi.fn(async () => [...commitments]),
    listLoans: vi.fn(async () => params.loans ?? []),
    listChits: vi.fn(async () => params.chits ?? []),
    saveCommitment: vi.fn(async (item: CommitmentRecord) => {
      saved.push(item);
      const index = commitments.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        commitments[index] = item;
      } else {
        commitments.push(item);
      }
    }),
    deleteCommitment: vi.fn(async (id: string) => {
      deleted.push(id);
      commitments = commitments.filter((item) => item.id !== id);
    }),
    getMoneyBreakdown: vi.fn(async () => moneyBreakdown),
    saveMoneyBreakdown: vi.fn(async (value: MoneyBreakdown) => {
      moneyBreakdown = value;
    })
  } as unknown as FinanceRepository;

  return {
    repository,
    saved,
    deleted,
    getCommitments: () => commitments,
    getMoney: () => moneyBreakdown
  };
}

describe("syncProductGeneratedCommitments", () => {
  it("preserves manual and legacy commitments while regenerating product ones", async () => {
    const staleProduct = commitment({
      id: "product:loans:old-loan:emi",
      title: "Old EMI",
      category: CommitmentCategory.LOAN_EMI,
      source: {
        kind: CommitmentSourceKind.PRODUCT_GENERATED,
        productTypeId: "loans",
        productId: "old-loan"
      },
      editable: false
    });
    const manual = commitment({ id: "manual-rent", title: "Rent" });
    const legacy = commitment({
      id: "legacy-emis",
      title: "Other EMIs",
      category: CommitmentCategory.LOAN_EMI,
      source: { kind: CommitmentSourceKind.LEGACY_MIGRATED, legacyField: "emis" },
      reviewStatus: CommitmentReviewStatus.NEEDS_REVIEW
    });

    const harness = createSyncRepo({
      commitments: [staleProduct, manual, legacy],
      loans: [sampleLoan()],
      chits: [sampleChit()]
    });

    const result = await syncProductGeneratedCommitments(harness.repository);

    expect(result.preservedCount).toBe(2);
    expect(result.generatedCount).toBe(2);
    expect(result.removedProductGeneratedCount).toBe(1);
    expect(harness.deleted).toContain(staleProduct.id);
    expect(harness.getCommitments().some((item) => item.id === manual.id)).toBe(true);
    expect(harness.getCommitments().some((item) => item.id === legacy.id)).toBe(true);
    expect(
      harness.saved.every((item) => item.source.kind === CommitmentSourceKind.PRODUCT_GENERATED)
    ).toBe(true);
  });

  it("removes product commitments when products are archived", async () => {
    const product = commitment({
      id: "product:loans:loan-1:emi",
      category: CommitmentCategory.LOAN_EMI,
      source: {
        kind: CommitmentSourceKind.PRODUCT_GENERATED,
        productTypeId: "loans",
        productId: "loan-1"
      },
      editable: false
    });

    const harness = createSyncRepo({
      commitments: [product],
      loans: [sampleLoan({ status: "archived" })],
      chits: []
    });

    const result = await syncProductGeneratedCommitments(harness.repository);

    expect(result.generatedCount).toBe(0);
    expect(result.removedProductGeneratedCount).toBe(1);
    expect(harness.deleted).toEqual([product.id]);
  });
});

describe("syncManualCommitmentsToMoneyBreakdown", () => {
  it("maps manual/legacy commitments into money fields without clearing loanPayments", async () => {
    const harness = createSyncRepo({
      commitments: [
        commitment({
          id: "rent",
          category: CommitmentCategory.RENT,
          amount: 18_000
        }),
        commitment({
          id: "utility",
          category: CommitmentCategory.UTILITY,
          amount: 2_500
        }),
        commitment({
          id: "legacy-emi",
          category: CommitmentCategory.LOAN_EMI,
          amount: 5_000,
          source: { kind: CommitmentSourceKind.LEGACY_MIGRATED, legacyField: "emis" }
        }),
        commitment({
          id: "product-emi",
          category: CommitmentCategory.LOAN_EMI,
          amount: 35_000,
          source: {
            kind: CommitmentSourceKind.PRODUCT_GENERATED,
            productTypeId: "loans",
            productId: "loan-1"
          }
        })
      ],
      moneyBreakdown: {
        monthlyIncome: 100_000,
        mandatoryExpenses: 0,
        emis: 0,
        loanPayments: 35_000,
        insurance: 0,
        rent: 0,
        utilityBills: 0,
        fixedCommitments: 0,
        emergencyBuffer: 50_000
      }
    });

    await syncManualCommitmentsToMoneyBreakdown(harness.repository);

    expect(harness.getMoney()).toMatchObject({
      rent: 18_000,
      utilityBills: 2_500,
      emis: 5_000,
      loanPayments: 35_000,
      emergencyBuffer: 50_000
    });
  });

  it("no-ops when money breakdown is missing", async () => {
    const harness = createSyncRepo({
      commitments: [commitment({ id: "rent" })],
      moneyBreakdown: null
    });

    await syncManualCommitmentsToMoneyBreakdown(harness.repository);

    expect(harness.repository.saveMoneyBreakdown).not.toHaveBeenCalled();
  });
});
