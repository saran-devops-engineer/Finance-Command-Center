import { describe, expect, it } from "vitest";
import { migrateSchemaV1ToV2 } from "@/storage/migration";
import { CommitmentReviewStatus, CommitmentSourceKind } from "@/shared/domain/commitment-record";
import { DataSchemaVersion } from "@/shared/domain/schema-version";
import type { MoneyBreakdown } from "@/shared/domain/finance";

const sampleMoney: MoneyBreakdown = {
  monthlyIncome: 85000,
  mandatoryExpenses: 12000,
  emis: 5000,
  loanPayments: 0,
  insurance: 2400,
  rent: 18000,
  utilityBills: 3500,
  fixedCommitments: 8000,
  emergencyBuffer: 50000
};

describe("migrateSchemaV1ToV2", () => {
  it("maps monthly income to a primary income source", () => {
    const result = migrateSchemaV1ToV2({
      moneyBreakdown: sampleMoney,
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe(DataSchemaVersion.V1);
    expect(result.toVersion).toBe(DataSchemaVersion.V2);
    expect(result.incomeProfile?.simpleMonthlyIncome).toBe(85000);
    expect(result.incomeProfile?.sources[0]?.isPrimary).toBe(true);
    expect(result.incomeProfile?.sources[0]?.monthlyAmount).toBe(85000);
  });

  it("creates legacy commitments with needs-review where ambiguous", () => {
    const result = migrateSchemaV1ToV2({
      moneyBreakdown: sampleMoney,
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    const byField = Object.fromEntries(
      result.commitments.map((item) => [item.source.legacyField, item])
    );

    expect(byField.emis?.reviewStatus).toBe(CommitmentReviewStatus.NEEDS_REVIEW);
    expect(byField.insurance?.reviewStatus).toBe(CommitmentReviewStatus.NEEDS_REVIEW);
    expect(byField.fixedCommitments?.reviewStatus).toBe(CommitmentReviewStatus.NEEDS_REVIEW);
    expect(byField.rent?.reviewStatus).toBe(CommitmentReviewStatus.CONFIRMED);
    expect(byField.utilityBills?.reviewStatus).toBe(CommitmentReviewStatus.CONFIRMED);
    expect(byField.mandatoryExpenses?.reviewStatus).toBe(CommitmentReviewStatus.CONFIRMED);
    expect(byField.emis?.source.kind).toBe(CommitmentSourceKind.LEGACY_MIGRATED);
    expect(result.needsReviewCount).toBeGreaterThan(0);
  });

  it("never invents commitments for zero-value fields", () => {
    const result = migrateSchemaV1ToV2({
      moneyBreakdown: {
        ...sampleMoney,
        emis: 0,
        insurance: 0,
        loanPayments: 0,
        fixedCommitments: 0
      },
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(result.commitments.some((item) => item.source.legacyField === "emis")).toBe(false);
    expect(result.commitments.some((item) => item.source.legacyField === "insurance")).toBe(false);
  });

  it("is idempotent when already on V2", () => {
    const first = migrateSchemaV1ToV2({
      moneyBreakdown: sampleMoney,
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    const second = migrateSchemaV1ToV2({
      moneyBreakdown: sampleMoney,
      existingIncomeProfile: first.incomeProfile,
      existingCommitments: first.commitments,
      existingSchemaMeta: first.schemaMeta,
      now: "2026-07-19T11:00:00.000Z"
    });

    expect(second.migrated).toBe(false);
    expect(second.commitmentsCreated).toBe(0);
    expect(second.commitments).toHaveLength(first.commitments.length);
  });

  it("preserves empty income when money breakdown is missing", () => {
    const result = migrateSchemaV1ToV2({
      moneyBreakdown: null,
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(result.migrated).toBe(true);
    expect(result.incomeProfile?.simpleMonthlyIncome).toBe(0);
    expect(result.commitments).toHaveLength(0);
  });

  it("never mutates the source moneyBreakdown object", () => {
    const money = structuredClone(sampleMoney);
    const frozen = structuredClone(sampleMoney);

    migrateSchemaV1ToV2({
      moneyBreakdown: money,
      existingIncomeProfile: null,
      existingCommitments: [],
      existingSchemaMeta: null,
      now: "2026-07-19T10:00:00.000Z"
    });

    expect(money).toEqual(frozen);
  });
});
