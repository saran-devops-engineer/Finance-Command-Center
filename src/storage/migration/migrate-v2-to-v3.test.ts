import { describe, expect, it } from "vitest";
import { migrateSchemaV2ToV3 } from "@/storage/migration";
import { DataSchemaVersion } from "@/shared/domain/schema-version";
import type { Loan, LoanPayment } from "@/shared/domain/finance";

const NOW = "2026-07-21T12:00:00.000Z";

function sampleLoan(): Loan {
  return {
    id: "loan-migrate",
    name: "Migrate Loan",
    type: "home",
    lender: "Bank",
    originalAmount: 1_000_000,
    outstandingBalance: 900_000,
    annualInterestRate: 8,
    monthlyEmi: 9000,
    principalPaid: 100_000,
    interestPaid: 0,
    remainingTenureMonths: 180,
    estimatedClosureDate: "2040-01-05",
    nextDueDate: "2026-07-05",
    loanStartDate: "2020-01-05",
    emiPaymentDay: 5,
    status: "active"
  };
}

describe("migrateSchemaV2ToV3", () => {
  it("bootstraps financial timelines for existing loans", () => {
    const loan = sampleLoan();
    const payments: LoanPayment[] = [
      {
        id: "pay-1",
        loanId: loan.id,
        kind: "emi",
        amount: 9000,
        principalAmount: 6000,
        interestAmount: 3000,
        paidOn: "2026-06-05T00:00:00.000Z"
      }
    ];

    const result = migrateSchemaV2ToV3({
      loans: [loan],
      loanPayments: payments,
      chits: [],
      existingTimelines: [],
      existingSchemaMeta: {
        id: "primary",
        schemaVersion: DataSchemaVersion.V2,
        migratedAt: NOW,
        migrationNotes: [],
        needsReviewCount: 0
      },
      existingSettings: null,
      now: NOW
    });

    expect(result.migrated).toBe(true);
    expect(result.toVersion).toBe(DataSchemaVersion.V3);
    expect(result.timelines).toHaveLength(1);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.activities.length).toBeGreaterThan(0);
    expect(result.schemaMeta.schemaVersion).toBe(DataSchemaVersion.V3);
  });

  it("is idempotent when timelines already exist on V3", () => {
    const first = migrateSchemaV2ToV3({
      loans: [sampleLoan()],
      loanPayments: [],
      chits: [],
      existingTimelines: [],
      existingSchemaMeta: null,
      existingSettings: null,
      now: NOW
    });

    const second = migrateSchemaV2ToV3({
      loans: [sampleLoan()],
      loanPayments: [],
      chits: [],
      existingTimelines: first.timelines,
      existingSchemaMeta: first.schemaMeta,
      existingSettings: first.settings,
      now: NOW
    });

    expect(second.migrated).toBe(false);
    expect(second.message).toContain("already initialized");
  });

  it("preserves outstanding and tenure in last confirmed state", () => {
    const loan = sampleLoan();
    const result = migrateSchemaV2ToV3({
      loans: [loan],
      loanPayments: [],
      chits: [],
      existingTimelines: [],
      existingSchemaMeta: null,
      existingSettings: null,
      now: NOW
    });

    const timeline = result.timelines[0]!;
    expect(timeline.lastConfirmedState.outstandingBalance).toBe(loan.outstandingBalance);
    expect(timeline.lastConfirmedState.remainingTenureMonths).toBe(loan.remainingTenureMonths);
  });
});
