import { describe, expect, it } from "vitest";
import { calculateEmi } from "@/engines/loan/home-loan/core/math";
import { homeLoanAmortizationEngine } from "@/engines/loan/home-loan/HomeLoanAmortizationEngine";
import type { HomeLoanSimulationSnapshot } from "@/engines/loan/home-loan/core/types";

const snapshot: HomeLoanSimulationSnapshot = {
  outstandingPrincipal: 2_200_000,
  monthlyEmi: calculateEmi(2_200_000, 12.35, 300),
  annualInterestRate: 12.35,
  remainingTenureMonths: 300,
  loanStartDate: "2020-01-01",
  emiPaymentDay: 5,
  asOfDate: "2026-07-07"
};

const baselineMonths = homeLoanAmortizationEngine.projectBaseline(snapshot).tenureMonths;

function run(targetMonths: number, debug = false) {
  return homeLoanAmortizationEngine.simulateTargetClosure({ snapshot, targetMonths, debug });
}

describe("Target Closure Date solver", () => {
  // "Close N years earlier" => target tenure = baseline - N*12.
  const yearsEarlier = [1, 2, 5, 10];

  it("requires higher monthly extra for earlier target dates", () => {
    const required = yearsEarlier.map(
      (years) => run(baselineMonths - years * 12).requiredMonthlyExtra
    );

    for (let index = 1; index < required.length; index += 1) {
      expect(required[index]).toBeGreaterThan(required[index - 1]);
    }
  });

  it("closes on or before the target for every scenario", () => {
    for (const years of yearsEarlier) {
      const targetMonths = baselineMonths - years * 12;
      const result = run(targetMonths);

      expect(result.valid).toBe(true);
      expect(result.achievable).toBe(true);
      expect(result.comparison.simulated.tenureMonths).toBeLessThanOrEqual(targetMonths);
    }
  });

  it("returns the MINIMUM monthly extra (one rupee less misses the target)", () => {
    const targetMonths = baselineMonths - 24;
    const result = run(targetMonths);

    expect(result.requiredMonthlyExtra).toBeGreaterThan(0);

    const oneRupeeLess = homeLoanAmortizationEngine.simulateMonthlyExtra({
      snapshot,
      monthlyExtraAmount: result.requiredMonthlyExtra - 1,
      strategy: "reduce-tenure"
    });

    expect(oneRupeeLess.newTenureMonths).toBeGreaterThan(targetMonths);
  });

  it("keeps EMI unchanged and derives savings from the schedule", () => {
    const result = run(baselineMonths - 24);
    expect(result.strategy).toBe("reduce-tenure");
    expect(result.newEmi).toBe(snapshot.monthlyEmi);
    const derived =
      result.comparison.original.totalInterest - result.comparison.simulated.totalInterest;
    expect(result.interestSaved).toBeCloseTo(derived, 6);
  });

  it("uses an efficient search (few iterations, not rupee-by-rupee)", () => {
    const result = run(baselineMonths - 60, true);
    expect(result.searchIterations).toBeLessThan(40);
    expect(result.searchSteps?.length).toBe(result.searchIterations);
  });

  it("rejects a target that is not earlier than the current closure", () => {
    const result = run(baselineMonths);
    expect(result.valid).toBe(false);
  });

  it("rejects a target of less than one month", () => {
    const result = run(0);
    expect(result.valid).toBe(false);
  });
});
