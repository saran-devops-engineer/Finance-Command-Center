import { describe, expect, it } from "vitest";
import {
  buildFinancialCommitments,
  groupFinancialCommitments,
  sumCommitmentsForMonth
} from "@/engines/commitment";
import type { Loan } from "@/shared/domain/finance";

const referenceDate = "2026-07-10";

function baseLoan(overrides: Partial<Loan>): Loan {
  return {
    id: "loan-base",
    name: "Loan",
    type: "personal",
    lender: "Bank",
    originalAmount: 100000,
    outstandingBalance: 100000,
    annualInterestRate: 12,
    monthlyEmi: 5000,
    principalPaid: 0,
    interestPaid: 0,
    remainingTenureMonths: 24,
    estimatedClosureDate: "",
    nextDueDate: "2026-07-20",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("Financial Commitment Engine", () => {
  it("creates a home loan EMI commitment", () => {
    const commitments = buildFinancialCommitments({
      loans: [
        baseLoan({
          id: "home-1",
          type: "home",
          name: "Home Loan",
          monthlyEmi: 45200,
          nextDueDate: "2026-07-15"
        })
      ],
      referenceDate
    });

    expect(commitments).toHaveLength(1);
    expect(commitments[0]?.commitmentType).toBe("emi");
    expect(commitments[0]?.priority).toBe("high");
    expect(commitments[0]?.amount).toBe(45200);
  });

  it("creates monthly and yearly gold loan commitments", () => {
    const monthlyGold = baseLoan({
      id: "gold-monthly",
      type: "gold",
      name: "Monthly Gold",
      goldInterestPaymentType: "monthly",
      outstandingBalance: 600000,
      annualInterestRate: 12,
      nextDueDate: "2026-07-18"
    });
    const yearlyGold = baseLoan({
      id: "gold-yearly",
      type: "gold",
      name: "Yearly Gold",
      goldInterestPaymentType: "yearly",
      outstandingBalance: 500000,
      annualInterestRate: 10,
      renewalDate: "2026-10-05",
      nextDueDate: "2026-10-05"
    });

    const commitments = buildFinancialCommitments({
      loans: [monthlyGold, yearlyGold],
      referenceDate
    });

    expect(commitments).toHaveLength(2);
    expect(commitments.find((entry) => entry.id.includes("monthly"))?.commitmentType).toBe(
      "monthly-interest"
    );
    expect(commitments.find((entry) => entry.id.includes("renewal"))?.priority).toBe("critical");
    expect(commitments.find((entry) => entry.id.includes("renewal"))?.amount).toBe(50000);
  });

  it("groups commitments across this month, next month, and next 90 days", () => {
    const commitments = buildFinancialCommitments({
      loans: [
        baseLoan({
          id: "home-1",
          type: "home",
          nextDueDate: "2026-07-20",
          monthlyEmi: 30000
        }),
        baseLoan({
          id: "home-2",
          type: "home",
          nextDueDate: "2026-08-12",
          monthlyEmi: 25000
        }),
        baseLoan({
          id: "gold-yearly",
          type: "gold",
          goldInterestPaymentType: "yearly",
          renewalDate: "2026-10-05",
          nextDueDate: "2026-10-05",
          outstandingBalance: 400000,
          annualInterestRate: 12
        })
      ],
      referenceDate
    });

    const groups = groupFinancialCommitments(commitments, referenceDate);

    expect(groups.map((group) => group.id)).toEqual(["this-month", "next-month", "next-90-days"]);
    expect(sumCommitmentsForMonth(commitments, referenceDate)).toBe(30000);
  });

  it("supports multiple gold loans", () => {
    const commitments = buildFinancialCommitments({
      loans: [
        baseLoan({
          id: "gold-1",
          type: "gold",
          name: "Gold A",
          goldInterestPaymentType: "monthly",
          outstandingBalance: 300000,
          annualInterestRate: 12,
          nextDueDate: "2026-07-12"
        }),
        baseLoan({
          id: "gold-2",
          type: "gold",
          name: "Gold B",
          goldInterestPaymentType: "yearly",
          renewalDate: "2026-09-20",
          nextDueDate: "2026-09-20",
          outstandingBalance: 400000,
          annualInterestRate: 10
        })
      ],
      referenceDate
    });

    expect(commitments).toHaveLength(2);
  });

  it("ignores archived loans", () => {
    const commitments = buildFinancialCommitments({
      loans: [
        baseLoan({
          id: "home-archived",
          type: "home",
          status: "archived",
          nextDueDate: "2026-07-15"
        })
      ],
      referenceDate
    });

    expect(commitments).toHaveLength(0);
  });
});
