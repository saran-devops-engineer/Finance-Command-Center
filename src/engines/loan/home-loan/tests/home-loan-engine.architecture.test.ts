/**
 * Home Loan Engine — architecture tests.
 *
 * @todo Replace with behaviour tests once banking rules and formulas are implemented.
 */

import { describe, it, expect } from "vitest";
import { homeLoanEngine } from "@/engines/loan/home-loan/services/HomeLoanEngine";
import { validationEngine } from "@/engines/loan/home-loan/validators/ValidationEngine";
import { emiCalculator } from "@/engines/loan/home-loan/calculators/EMICalculator";
import { amortizationCalculator } from "@/engines/loan/home-loan/calculators/AmortizationCalculator";
import { paymentProcessor } from "@/engines/loan/home-loan/services/PaymentProcessor";
import { simulationEngine } from "@/engines/loan/home-loan/simulators/SimulationEngine";
import { recommendationEngine } from "@/engines/loan/home-loan/recommendations/RecommendationEngine";
import { lumpSumOneTimePaymentSimulator } from "@/engines/loan/home-loan/simulators/lump-sum-one-time-payment";
import { monthlyExtraPaymentSimulator } from "@/engines/loan/home-loan/simulators/monthly-extra-payment";

describe("Home Loan Engine architecture", () => {
  it("exports a wired HomeLoanEngine facade", () => {
    expect(homeLoanEngine).toBeDefined();
    expect(typeof homeLoanEngine.analyze).toBe("function");
    expect(typeof homeLoanEngine.processPayment).toBe("function");
    expect(typeof homeLoanEngine.loadLoan).toBe("function");
  });

  it("exposes independently replaceable module implementations", () => {
    expect(validationEngine).toBeDefined();
    expect(emiCalculator).toBeDefined();
    expect(amortizationCalculator).toBeDefined();
    expect(paymentProcessor).toBeDefined();
    expect(simulationEngine).toBeDefined();
    expect(recommendationEngine).toBeDefined();
  });

  it("calculates EMI deterministically", () => {
    const result = emiCalculator.calculate({
      principal: 1_000_000,
      annualInterestRate: 8.5,
      tenureMonths: 240
    });
    expect(result.monthlyEmi).toBeGreaterThan(0);
  });

  it("exposes approved rule-set simulators", () => {
    expect(lumpSumOneTimePaymentSimulator).toBeDefined();
    expect(typeof lumpSumOneTimePaymentSimulator.simulate).toBe("function");
    expect(monthlyExtraPaymentSimulator).toBeDefined();
    expect(typeof monthlyExtraPaymentSimulator.simulate).toBe("function");
  });
});
