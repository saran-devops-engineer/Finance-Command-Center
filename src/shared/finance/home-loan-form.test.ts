import { describe, expect, it } from "vitest";
import type { Loan } from "@/shared/domain/finance";
import {
  applyHomeLoanAutoCalculations,
  buildHomeLoanFromForm,
  homeLoanToFormState,
  initialHomeLoanFormState,
  migrateLegacyHomeLoan,
  validateHomeLoanForm
} from "@/shared/finance/home-loan-form";
import { normalizeLoan } from "@/lib/loan-status";
import { snapshotFromPersistedLoan as homeLoanSnapshotFromPersistedLoan } from "@/engines/loan/home-loan/adapters/from-persisted-loan";

describe("Home Loan Data Model V1", () => {
  it("validates required home loan fields", () => {
    const errors = validateHomeLoanForm(initialHomeLoanFormState);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("auto-calculates remaining tenure until manually overridden", () => {
    const base = {
      ...initialHomeLoanFormState,
      originalAmount: "4200000",
      loanStartDate: "2018-03-05",
      originalLoanTenureMonths: "360",
      annualInterestRate: "8.6",
      outstandingBalance: "3820000",
      monthlyEmi: "45200"
    };

    const next = applyHomeLoanAutoCalculations(base, initialHomeLoanFormState);
    expect(Number(next.remainingTenureMonths)).toBeGreaterThan(0);
    expect(next.remainingTenureManuallyOverridden).toBe(false);

    const manual = applyHomeLoanAutoCalculations(
      { ...next, remainingTenureMonths: "200", remainingTenureManuallyOverridden: true },
      next
    );
    expect(manual.remainingTenureMonths).toBe("200");
  });

  it("does not overwrite manually overridden remaining tenure when original amount changes", () => {
    const previous = {
      ...initialHomeLoanFormState,
      originalAmount: "4200000",
      loanStartDate: "2018-03-05",
      originalLoanTenureMonths: "360",
      remainingTenureMonths: "214",
      remainingTenureManuallyOverridden: true
    };

    const next = applyHomeLoanAutoCalculations(
      { ...previous, originalAmount: "4300000" },
      previous
    );

    expect(next.remainingTenureMonths).toBe("214");
  });

  it("migrates legacy home loans without losing snapshot values", () => {
    const legacy: Loan = {
      id: "legacy-home",
      name: "Legacy Home Loan",
      type: "home",
      lender: "Test Bank",
      originalAmount: 1000000,
      outstandingBalance: 800000,
      annualInterestRate: 8.5,
      monthlyEmi: 10000,
      principalPaid: 200000,
      interestPaid: 0,
      remainingTenureMonths: 120,
      estimatedClosureDate: "2034-01-01",
      nextDueDate: "2028-03-10"
    };

    const migrated = migrateLegacyHomeLoan(legacy);
    expect(migrated.loanStartDate).toBeTruthy();
    expect(migrated.originalLoanTenureMonths).toBeGreaterThanOrEqual(120);
    expect(migrated.emiPaymentDay).toBe(10);
    expect(migrated.remainingTenureMonths).toBe(120);
    expect(migrated.remainingTenureManuallyOverridden).toBe(true);
  });

  it("normalizes home loans through repository migration path", () => {
    const normalized = normalizeLoan({
      id: "home-1",
      name: "Home",
      type: "home",
      lender: "Bank",
      originalAmount: 1000000,
      outstandingBalance: 900000,
      annualInterestRate: 8,
      monthlyEmi: 9000,
      principalPaid: 100000,
      interestPaid: 0,
      remainingTenureMonths: 180,
      estimatedClosureDate: "2038-01-01",
      nextDueDate: "2028-03-01"
    });

    expect(normalized.loanStartDate).toBeTruthy();
    expect(normalized.emiPaymentDay).toBe(1);
  });

  it("builds engine snapshot from current snapshot fields only", () => {
    const loan = buildHomeLoanFromForm({
      ...initialHomeLoanFormState,
      name: "Plot Loan",
      lender: "HDFC Bank",
      originalAmount: "4200000",
      loanStartDate: "2018-03-05",
      originalLoanTenureMonths: "360",
      annualInterestRate: "8.6",
      outstandingBalance: "3820000",
      monthlyEmi: "45200",
      remainingTenureMonths: "214",
      emiPaymentDay: "5"
    });

    const snapshot = homeLoanSnapshotFromPersistedLoan(loan);
    expect(snapshot.outstandingPrincipal).toBe(3_820_000);
    expect(snapshot.monthlyEmi).toBe(45200);
    expect(snapshot.remainingTenureMonths).toBe(214);
    expect(snapshot.annualInterestRate).toBe(8.6);
  });

  it("round-trips persisted home loan through form state", () => {
    const loan = buildHomeLoanFromForm({
      ...initialHomeLoanFormState,
      name: "Plot Loan",
      lender: "HDFC Bank",
      originalAmount: "4200000",
      loanStartDate: "2018-03-05",
      originalLoanTenureMonths: "360",
      annualInterestRate: "8.6",
      outstandingBalance: "3820000",
      monthlyEmi: "45200",
      remainingTenureMonths: "214",
      emiPaymentDay: "5"
    });

    const form = homeLoanToFormState(loan);
    expect(form.name).toBe("Plot Loan");
    expect(form.loanStartDate).toBe("2018-03-05");
    expect(form.emiPaymentDay).toBe("5");
  });
});
