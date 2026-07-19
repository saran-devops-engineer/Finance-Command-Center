import { describe, expect, it } from "vitest";
import { buildFinancialCommitments } from "@/engines/commitment";
import { generateFinancialInsights } from "@/engines/financial-insights";
import { deriveChitMetrics } from "@/shared/finance/chit-calculations";
import {
  buildChitFromForm,
  initialChitFormState,
  validateChitForm
} from "@/shared/finance/chit-form";
import type { Chit } from "@/shared/domain/chit";

const referenceDate = "2026-07-10";

function baseChit(overrides: Partial<Chit>): Chit {
  return {
    id: "chit-base",
    providerType: "registered",
    registeredProvider: "margadarshi",
    providerName: "Margadarshi",
    chitName: "Family Chit",
    chitValue: 500000,
    monthlyContribution: 25000,
    totalDurationMonths: 20,
    startDate: "2026-01-01",
    currentRunningMonth: 5,
    prizeReceived: false,
    nextDueDate: "2026-06-01",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("Chit Management Engine V1", () => {
  it("validates registered chit basics", () => {
    const errors = validateChitForm({
      ...initialChitFormState,
      chitName: "Office Chit",
      chitValue: "500000",
      monthlyContribution: "25000",
      totalDurationMonths: "20",
      currentRunningMonth: "5"
    });

    expect(errors).toHaveLength(0);
  });

  it("validates local chit with custom rules and commission", () => {
    const errors = validateChitForm({
      ...initialChitFormState,
      providerType: "local",
      providerName: "Neighborhood Committee",
      chitName: "Street Chit",
      chitValue: "200000",
      monthlyContribution: "10000",
      totalDurationMonths: "20",
      currentRunningMonth: "3",
      winnerSelection: "lottery",
      discountDistribution: "shared-everyone",
      paymentChangesAfterAuction: "no",
      organizerCommission: "yes",
      commissionInputType: "percentage",
      commissionPercentage: "5"
    });

    expect(errors).toHaveLength(0);

    const chit = buildChitFromForm({
      ...initialChitFormState,
      providerType: "local",
      providerName: "Neighborhood Committee",
      chitName: "Street Chit",
      chitValue: "200000",
      monthlyContribution: "10000",
      totalDurationMonths: "20",
      currentRunningMonth: "3",
      winnerSelection: "lottery",
      discountDistribution: "shared-everyone",
      paymentChangesAfterAuction: "no",
      organizerCommission: "yes",
      commissionInputType: "percentage",
      commissionPercentage: "5"
    });

    expect(chit.customRules?.commissionMode).toBe("percentage");
    expect(chit.customRules?.commissionPercentage).toBe(5);
  });

  it("rejects invalid prize and month combinations", () => {
    const errors = validateChitForm({
      ...initialChitFormState,
      chitName: "Test",
      providerName: "Margadarshi",
      chitValue: "100000",
      monthlyContribution: "5000",
      totalDurationMonths: "10",
      currentRunningMonth: "4",
      prizeReceived: "yes",
      auctionMonth: "6",
      prizeAmountReceived: "150000"
    });

    expect(errors.some((error) => error.includes("Auction month"))).toBe(true);
    expect(errors.some((error) => error.includes("Prize amount"))).toBe(true);
  });

  it("calculates remaining months and participation", () => {
    const activeMetrics = deriveChitMetrics(baseChit({ currentRunningMonth: 5, prizeReceived: false }));
    expect(activeMetrics.remainingMonths).toBe(15);
    expect(activeMetrics.totalRemainingContribution).toBe(375000);
    expect(activeMetrics.expectedRemainingParticipation).toBe(375000);

    const prizeMetrics = deriveChitMetrics(
      baseChit({ currentRunningMonth: 12, prizeReceived: true, auctionMonth: 8 })
    );
    expect(prizeMetrics.remainingInstallments).toBe(8);
    expect(prizeMetrics.shouldSuggestArchive).toBe(false);

    const completeMetrics = deriveChitMetrics(baseChit({ currentRunningMonth: 20 }));
    expect(completeMetrics.remainingMonths).toBe(0);
    expect(completeMetrics.shouldSuggestArchive).toBe(true);
  });

  it("creates monthly chit commitments for active chits", () => {
    const commitments = buildFinancialCommitments({
      loans: [],
      chits: [
        baseChit({
          id: "chit-1",
          chitName: "Office Chit",
          monthlyContribution: 12000,
          nextDueDate: "2026-07-15"
        })
      ],
      referenceDate
    });

    expect(commitments).toHaveLength(1);
    expect(commitments[0]?.commitmentType).toBe("monthly-contribution");
    expect(commitments[0]?.priority).toBe("medium");
    expect(commitments[0]?.amount).toBe(12000);
    expect(commitments[0]?.chitId).toBe("chit-1");
  });

  it("skips commitments for completed or archived chits", () => {
    const commitments = buildFinancialCommitments({
      loans: [],
      chits: [
        baseChit({ id: "complete", currentRunningMonth: 20 }),
        baseChit({ id: "archived", status: "archived" })
      ],
      referenceDate
    });

    expect(commitments).toHaveLength(0);
  });

  it("generates basic chit insights", () => {
    const chits = [
      baseChit({ id: "active", prizeReceived: false, currentRunningMonth: 5 }),
      baseChit({
        id: "near-complete",
        prizeReceived: true,
        currentRunningMonth: 18,
        totalDurationMonths: 20
      })
    ];

    const insights = generateFinancialInsights(
      {
        loans: [],
        chits,
        commitments: [],
        referenceDate,
        moneyBreakdown: {
          monthlyIncome: 85000,
          mandatoryExpenses: 10000,
          emis: 20000,
          loanPayments: 0,
          insurance: 2000,
          rent: 15000,
          utilityBills: 3000,
          fixedCommitments: 5000,
          emergencyBuffer: 40000
        }
      },
      5
    );

    expect(
      insights.some((insight) => insight.message.includes("Your chit is active"))
    ).toBe(true);
    expect(
      insights.some((insight) =>
        insight.message.includes("Continue paying remaining installments")
      )
    ).toBe(true);
    expect(
      insights.some((insight) => insight.message.includes("nearing completion"))
    ).toBe(true);
  });
});
