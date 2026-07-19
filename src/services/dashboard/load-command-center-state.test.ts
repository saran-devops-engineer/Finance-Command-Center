import { describe, expect, it, vi } from "vitest";
import { loadCommandCenterState } from "@/services/dashboard/load-command-center-state";
import type { FinanceRepository } from "@/core/repository/finance-repository";
import type { Loan, MoneyBreakdown, UserProfile } from "@/shared/domain/finance";
import { IncomeMode } from "@/shared/domain/income";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind,
  type CommitmentRecord
} from "@/shared/domain/commitment-record";

vi.mock("@/services/commitment-sync/sync-product-commitments", () => ({
  syncProductGeneratedCommitments: vi.fn(async () => ({
    preservedCount: 0,
    generatedCount: 0,
    removedProductGeneratedCount: 0
  }))
}));

import { syncProductGeneratedCommitments } from "@/services/commitment-sync/sync-product-commitments";

const profile: UserProfile = {
  id: "profile",
  displayName: "Arjun",
  onboardingCompleted: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const moneyBreakdown: MoneyBreakdown = {
  monthlyIncome: 100_000,
  mandatoryExpenses: 0,
  emis: 0,
  loanPayments: 0,
  insurance: 0,
  rent: 0,
  utilityBills: 0,
  fixedCommitments: 0,
  emergencyBuffer: 60_000
};

function commitment(overrides: Partial<CommitmentRecord>): CommitmentRecord {
  return {
    id: "c1",
    title: "Rent",
    category: CommitmentCategory.RENT,
    amount: 20_000,
    frequency: CommitmentFrequency.MONTHLY,
    nextDueDate: "2026-08-01",
    priority: CommitmentPriority.HIGH,
    source: { kind: CommitmentSourceKind.MANUAL },
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    reminderEnabled: false,
    editable: true,
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-19T00:00:00.000Z",
    ...overrides
  };
}

function createRepo(overrides: {
  profile?: UserProfile | null;
  incomeProfile?: Awaited<ReturnType<FinanceRepository["getIncomeProfile"]>>;
  commitments?: CommitmentRecord[];
  moneyBreakdown?: MoneyBreakdown | null;
  loans?: Loan[];
} = {}): FinanceRepository {
  return {
    getProfile: vi.fn(async () =>
      overrides.profile === undefined ? profile : overrides.profile
    ),
    getIncomeProfile: vi.fn(async () =>
      Object.prototype.hasOwnProperty.call(overrides, "incomeProfile")
        ? (overrides.incomeProfile as Awaited<ReturnType<FinanceRepository["getIncomeProfile"]>>)
        : {
            mode: IncomeMode.SIMPLE,
            simpleMonthlyIncome: 100_000,
            sources: [],
            updatedAt: "2026-07-19T00:00:00.000Z"
          }
    ),
    listCommitments: vi.fn(
      async () =>
        overrides.commitments ?? [
          commitment({ amount: 20_000 }),
          commitment({
            id: "emi",
            title: "EMI",
            category: CommitmentCategory.LOAN_EMI,
            amount: 30_000,
            source: {
              kind: CommitmentSourceKind.PRODUCT_GENERATED,
              productTypeId: "loans",
              productId: "loan-1"
            }
          })
        ]
    ),
    getMoneyBreakdown: vi.fn(
      async () =>
        overrides.moneyBreakdown === undefined ? moneyBreakdown : overrides.moneyBreakdown
    ),
    listLoans: vi.fn(async () => overrides.loans ?? []),
    listChits: vi.fn(async () => []),
    listUpcomingDues: vi.fn(async () => []),
    getSettings: vi.fn(async () => ({ pinnedLoanId: null }))
  } as unknown as FinanceRepository;
}

describe("loadCommandCenterState", () => {
  it("syncs product commitments then calculates available cash", async () => {
    const repository = createRepo();
    const state = await loadCommandCenterState(repository);

    expect(syncProductGeneratedCommitments).toHaveBeenCalledWith(repository);
    expect(state).not.toBeNull();
    expect(state!.cashFlow.totalMonthlyIncome).toBe(100_000);
    expect(state!.cashFlow.totalMonthlyCommitments).toBe(50_000);
    expect(state!.cashFlow.availableCash).toBe(50_000);
    expect(state!.snapshot.availableMoney).toBe(50_000);
    expect(state!.snapshot.mandatoryCommitments).toBe(50_000);
  });

  it("returns null when onboarding is incomplete", async () => {
    const repository = createRepo({
      profile: { ...profile, onboardingCompleted: false }
    });

    await expect(loadCommandCenterState(repository)).resolves.toBeNull();
  });

  it("falls back to moneyBreakdown income when income profile is missing", async () => {
    const repository = createRepo({
      incomeProfile: null,
      moneyBreakdown: { ...moneyBreakdown, monthlyIncome: 80_000 },
      commitments: [commitment({ amount: 15_000 })]
    });

    const state = await loadCommandCenterState(repository);

    expect(state!.cashFlow.totalMonthlyIncome).toBe(80_000);
    expect(state!.cashFlow.availableCash).toBe(65_000);
  });
});
