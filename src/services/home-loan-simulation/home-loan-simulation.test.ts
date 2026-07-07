import { describe, expect, it } from "vitest";
import { calculateEmi } from "@/engines/loan/home-loan/core/math";
import { homeLoanSimulationEngine } from "@/services/home-loan-simulation/engine";
import type { HomeLoanSimulationInput } from "@/services/home-loan-simulation/types";

const sampleInput: HomeLoanSimulationInput = {
  loanId: "home-test",
  outstandingBalance: 2_200_000,
  annualInterestRate: 12.35,
  monthlyEmi: calculateEmi(2_200_000, 12.35, 300),
  remainingTenureMonths: 300,
  loanStartDate: "2020-01-01",
  emiPaymentDay: 5,
  asOfDate: "2026-07-07"
};

describe("homeLoanSimulationEngine", () => {
  it("projects baseline from full amortization schedule", () => {
    const result = homeLoanSimulationEngine.projectBaseline(sampleInput);
    expect(result.baseline.remainingMonths).toBeGreaterThan(0);
    expect(result.baseline.totalInterestRemaining).toBeGreaterThan(0);
  });

  it("simulates reduce-tenure prepayment", () => {
    const result = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-tenure",
      prepaymentAmount: 100_000
    });

    expect(result.outcome.interestSaved).toBeGreaterThan(0);
    expect(result.outcome.monthsSaved).toBeGreaterThan(0);
    expect(result.outcome.revisedOutstanding).toBe(sampleInput.outstandingBalance - 100_000);
  });

  it("simulates reduce-emi prepayment", () => {
    const result = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-emi",
      prepaymentAmount: 100_000
    });

    expect(result.outcome.revisedEmi).toBeDefined();
    expect(result.outcome.revisedEmi!).toBeLessThan(sampleInput.monthlyEmi);
  });

  it("compares prepayment strategies", () => {
    const result = homeLoanSimulationEngine.comparePrepayment(sampleInput, 100_000);

    expect(result.reduceTenure.outcome.interestSaved).toBeGreaterThan(
      result.reduceEmi.outcome.interestSaved
    );
    expect(result.recommendation.preferredStrategy).toBe("reduce-tenure");
  });
});
