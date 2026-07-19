import { describe, expect, it, vi } from "vitest";
import {
  createJsonBackup,
  inspectJsonBackup,
  restoreJsonBackup
} from "@/storage/backup/backup-service";
import {
  BACKUP_PLATFORM,
  BACKUP_SIGNATURE,
  BACKUP_VERSION
} from "@/storage/backup/backup-format";
import type { FinanceDataSnapshot, MoneyBreakdown } from "@/shared/domain/finance";
import { IncomeMode } from "@/shared/domain/income";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind
} from "@/shared/domain/commitment-record";
import { migrateSchemaV1ToV2 } from "@/storage/migration";

const moneyBreakdown: MoneyBreakdown = {
  monthlyIncome: 90_000,
  mandatoryExpenses: 10_000,
  emis: 4_000,
  loanPayments: 0,
  insurance: 2_000,
  rent: 20_000,
  utilityBills: 3_000,
  fixedCommitments: 5_000,
  emergencyBuffer: 40_000
};

function v1Snapshot(overrides: Partial<FinanceDataSnapshot> = {}): FinanceDataSnapshot {
  return {
    schemaVersion: 1,
    exportedAt: "2026-07-19T10:00:00.000Z",
    profile: {
      id: "profile",
      displayName: "Arjun",
      onboardingCompleted: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    },
    moneyBreakdown,
    loans: [],
    loanPayments: [],
    upcomingDues: [],
    chits: [],
    incomeProfile: null,
    commitments: [],
    ...overrides
  };
}

function v2Snapshot(): FinanceDataSnapshot {
  return {
    ...v1Snapshot({ schemaVersion: 2 }),
    incomeProfile: {
      mode: IncomeMode.SIMPLE,
      simpleMonthlyIncome: 90_000,
      sources: [],
      updatedAt: "2026-07-19T10:00:00.000Z"
    },
    commitments: [
      {
        id: "rent-1",
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
        createdAt: "2026-07-19T10:00:00.000Z",
        updatedAt: "2026-07-19T10:00:00.000Z"
      }
    ]
  };
}

function createMockRepo(snapshot: FinanceDataSnapshot) {
  let stored = structuredClone(snapshot);

  return {
    createDataSnapshot: vi.fn(async () => structuredClone(stored)),
    replaceAllData: vi.fn(async (next: FinanceDataSnapshot) => {
      stored = structuredClone(next);
    }),
    getStored: () => stored
  };
}

async function checksumFor(snapshot: FinanceDataSnapshot) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("backup service — Phase 6 schema compatibility", () => {
  it("exports schema V1 with moneyBreakdown and matching checksum", async () => {
    const repo = createMockRepo(v1Snapshot());
    const result = await createJsonBackup({ repository: repo });

    expect(result.backup.signature).toBe(BACKUP_SIGNATURE);
    expect(result.backup.backupVersion).toBe(BACKUP_VERSION);
    expect(result.backup.platform).toBe(BACKUP_PLATFORM);
    expect(result.backup.data.schemaVersion).toBe(1);
    expect(result.backup.data.moneyBreakdown).toEqual(moneyBreakdown);
    expect(result.backup.metadata.hasMoneyBreakdown).toBe(true);
    expect(result.backup.checksum).toBe(await checksumFor(result.backup.data));
  });

  it("round-trips schema V2 income + commitments without dropping moneyBreakdown", async () => {
    const repo = createMockRepo(v2Snapshot());
    const exported = await createJsonBackup({ repository: repo });
    const file = new File([JSON.stringify(exported.backup)], "backup.json", {
      type: "application/json"
    });

    const target = createMockRepo(v1Snapshot({ moneyBreakdown: null, profile: null }));
    const restored = await restoreJsonBackup({ file, repository: target });

    expect(restored.snapshot.schemaVersion).toBe(2);
    expect(restored.snapshot.moneyBreakdown).toEqual(moneyBreakdown);
    expect(restored.snapshot.incomeProfile?.simpleMonthlyIncome).toBe(90_000);
    expect(restored.snapshot.commitments).toHaveLength(1);
    expect(target.replaceAllData).toHaveBeenCalledTimes(1);
    expect(target.getStored().moneyBreakdown).toEqual(moneyBreakdown);
  });

  it("accepts V1 backup restore then migrates to V2 without deleting money", async () => {
    const repo = createMockRepo(v1Snapshot());
    const exported = await createJsonBackup({ repository: repo });
    const file = new File([JSON.stringify(exported.backup)], "v1.json", {
      type: "application/json"
    });

    const target = createMockRepo(v1Snapshot({ moneyBreakdown: null }));
    const restored = await restoreJsonBackup({ file, repository: target });
    const originalMoney = structuredClone(restored.snapshot.moneyBreakdown);

    const migrated = migrateSchemaV1ToV2({
      moneyBreakdown: restored.snapshot.moneyBreakdown,
      existingIncomeProfile: restored.snapshot.incomeProfile ?? null,
      existingCommitments: restored.snapshot.commitments ?? [],
      existingSchemaMeta: null,
      now: "2026-07-19T12:00:00.000Z"
    });

    expect(originalMoney).toEqual(moneyBreakdown);
    expect(migrated.migrated).toBe(true);
    expect(migrated.incomeProfile?.simpleMonthlyIncome).toBe(90_000);
    expect(migrated.needsReviewCount).toBeGreaterThan(0);
    // Migration never mutates or clears the V1 money payload used as input.
    expect(restored.snapshot.moneyBreakdown).toEqual(moneyBreakdown);
  });

  it("rejects unsupported schema versions and corrupted checksums", async () => {
    const valid = await createJsonBackup({ repository: createMockRepo(v1Snapshot()) });

    const badSchema = {
      ...valid.backup,
      data: { ...valid.backup.data, schemaVersion: 99 },
      checksum: await checksumFor({ ...valid.backup.data, schemaVersion: 99 as 1 })
    };

    await expect(
      inspectJsonBackup(
        new File([JSON.stringify(badSchema)], "bad-schema.json", { type: "application/json" })
      )
    ).rejects.toThrow(/Unsupported backup data schema/);

    const tampered = {
      ...valid.backup,
      checksum: "0".repeat(64)
    };

    await expect(
      inspectJsonBackup(
        new File([JSON.stringify(tampered)], "bad-checksum.json", { type: "application/json" })
      )
    ).rejects.toThrow(/Checksum does not match/);
  });

  it("rejects empty backup files", async () => {
    await expect(
      inspectJsonBackup(new File([], "empty.json", { type: "application/json" }))
    ).rejects.toThrow(/empty/i);
  });
});
