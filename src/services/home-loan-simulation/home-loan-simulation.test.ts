import { describe, expect, it } from "vitest";
import { calculateEmi, calculateTenure } from "@/services/home-loan-simulation/calculators/emi";
import { buildAmortizationSchedule } from "@/services/home-loan-simulation/calculators/amortization-schedule";
import { homeLoanSimulationEngine } from "@/services/home-loan-simulation/engine";
import { recommendPrepaymentStrategy } from "@/services/home-loan-simulation/recommendations/prepayment-strategy";
import type { HomeLoanSimulationInput } from "@/services/home-loan-simulation/types";

const sampleInput: HomeLoanSimulationInput = {
  loanId: "home-1",
  outstandingBalance: 4_500_000,
  annualInterestRate: 8.5,
  monthlyEmi: 38_000,
  remainingTenureMonths: 240,
  originalAmount: 5_000_000,
  asOfDate: "2026-01-01T00:00:00.000Z"
};

describe("calculateEmi", () => {
  it("returns a positive EMI for a standard home loan", () => {
    const emi = calculateEmi(4_500_000, 8.5, 240);
    expect(emi).toBeGreaterThan(30_000);
    expect(emi).toBeLessThan(45_000);
  });

  it("returns zero for non-positive principal", () => {
    expect(calculateEmi(0, 8.5, 240)).toBe(0);
  });
});

describe("calculateTenure", () => {
  it("returns fewer months after principal is reduced at the same EMI", () => {
    const original = calculateTenure(4_500_000, 8.5, 38_000, 240);
    const revised = calculateTenure(4_450_000, 8.5, 38_000, 240);
    expect(revised).toBeLessThan(original);
  });
});

describe("buildAmortizationSchedule", () => {
  it("reaches zero balance for a standard loan", () => {
    const schedule = buildAmortizationSchedule({
      principal: 1_000_000,
      annualInterestRate: 8.5,
      monthlyEmi: calculateEmi(1_000_000, 8.5, 120),
      asOfDate: "2026-01-01T00:00:00.000Z",
      maxMonths: 150
    });

    expect(schedule.closureMonth).not.toBeNull();
    expect(schedule.months.at(-1)?.closingBalance).toBe(0);
  });
});

describe("homeLoanSimulationEngine", () => {
  it("projects a baseline schedule", () => {
    const result = homeLoanSimulationEngine.projectBaseline(sampleInput);

    expect(result.scenario).toBe("baseline-projection");
    expect(result.isEstimate).toBe(true);
    expect(result.baseline.remainingMonths).toBeGreaterThan(0);
    expect(result.outcome.interestSaved).toBe(0);
  });

  it("saves interest and months when prepaying with tenure reduction", () => {
    const result = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-tenure",
      prepaymentAmount: 100_000
    });

    expect(result.scenario).toBe("prepay-reduce-tenure");
    expect(result.outcome.interestSaved).toBeGreaterThan(0);
    expect(result.outcome.monthsSaved).toBeGreaterThan(0);
    expect(result.outcome.revisedOutstanding).toBe(4_400_000);
  });

  it("reduces EMI when prepaying with EMI reduction strategy", () => {
    const result = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-emi",
      prepaymentAmount: 100_000
    });

    expect(result.scenario).toBe("prepay-reduce-emi");
    expect(result.outcome.revisedEmi).toBeDefined();
    expect(result.outcome.revisedEmi!).toBeLessThan(sampleInput.monthlyEmi);
    expect(result.outcome.monthsSaved).toBe(0);
    expect(result.baseline.remainingMonths).toBe(sampleInput.remainingTenureMonths);
    expect(result.outcome.remainingMonths).toBe(sampleInput.remainingTenureMonths);
  });

  it("uses the standard EMI formula for a known loan", () => {
    const principal = 1_000_000;
    const months = 120;
    const emi = calculateEmi(principal, 8.5, months);

    expect(emi * months).toBeGreaterThan(principal);
    expect(emi).toBeGreaterThan(12_300);
    expect(emi).toBeLessThan(12_500);
  });

  it("compares prepayment strategies", () => {
    const result = homeLoanSimulationEngine.comparePrepayment(sampleInput, 100_000);

    expect(result.reduceTenure.outcome.interestSaved).toBeGreaterThan(0);
    expect(result.reduceEmi.outcome.revisedEmi).toBeDefined();
    expect(result.recommendation.preferredStrategy).toBe("neutral");
  });
});

describe("recommendPrepaymentStrategy", () => {
  it("prefers reduce-emi when debt-to-income is high", () => {
    const reduceTenure = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-tenure",
      prepaymentAmount: 50_000
    });
    const reduceEmi = homeLoanSimulationEngine.simulate(sampleInput, {
      kind: "prepay-reduce-emi",
      prepaymentAmount: 50_000
    });

    const recommendation = recommendPrepaymentStrategy({
      input: sampleInput,
      reduceTenure,
      reduceEmi,
      context: { debtToIncomeRatio: 0.5 }
    });

    expect(recommendation.preferredStrategy).toBe("reduce-emi");
  });
});
