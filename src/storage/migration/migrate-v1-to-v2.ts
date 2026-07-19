/**
 * FCC V2 schema migration framework.
 * Pure transforms + orchestration. Never deletes V1 financial data.
 */

import type { MoneyBreakdown } from "@/shared/domain/finance";
import type { IncomeProfile, IncomeSource } from "@/shared/domain/income";
import {
  IncomeMode,
  IncomeSourceKind,
  createSimpleIncomeProfile
} from "@/shared/domain/income";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import {
  CommitmentCategory,
  CommitmentFrequency,
  CommitmentPriority,
  CommitmentReviewStatus,
  CommitmentSourceKind
} from "@/shared/domain/commitment-record";
import {
  DataSchemaVersion,
  type DataSchemaVersionValue,
  type SchemaMeta,
  SCHEMA_META_ID
} from "@/shared/domain/schema-version";

export interface SchemaMigrationInput {
  moneyBreakdown: MoneyBreakdown | null;
  existingIncomeProfile: IncomeProfile | null;
  existingCommitments: CommitmentRecord[];
  existingSchemaMeta: SchemaMeta | null;
  now?: string;
}

export interface SchemaMigrationResult {
  migrated: boolean;
  fromVersion: DataSchemaVersionValue;
  toVersion: DataSchemaVersionValue;
  incomeProfile: IncomeProfile | null;
  commitments: CommitmentRecord[];
  schemaMeta: SchemaMeta;
  commitmentsCreated: number;
  needsReviewCount: number;
  notes: string[];
  message: string;
}

interface LegacyFieldMapping {
  field: keyof MoneyBreakdown;
  title: string;
  category: CommitmentRecord["category"];
  frequency: CommitmentRecord["frequency"];
  reviewStatus: CommitmentRecord["reviewStatus"];
  priority: CommitmentRecord["priority"];
  note: string;
}

/**
 * Maps V1 MoneyBreakdown expense fields to V2 commitment records.
 * Never invents amounts — skips zero/empty fields.
 * Marks ambiguous fields as needs-review rather than guessing.
 */
const LEGACY_FIELD_MAPPINGS: LegacyFieldMapping[] = [
  {
    field: "emis",
    title: "Other EMIs",
    category: CommitmentCategory.LOAN_EMI,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.NEEDS_REVIEW,
    priority: CommitmentPriority.HIGH,
    note: "Migrated from V1 Other EMIs. Confirm this is not already covered by a loan product."
  },
  {
    field: "loanPayments",
    title: "Loan payments (legacy)",
    category: CommitmentCategory.LOAN_EMI,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.NEEDS_REVIEW,
    priority: CommitmentPriority.HIGH,
    note: "Migrated from V1 loan payments field. Confirm this is not already covered by a loan product."
  },
  {
    field: "insurance",
    title: "Insurance",
    category: CommitmentCategory.INSURANCE_PREMIUM,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.NEEDS_REVIEW,
    priority: CommitmentPriority.MEDIUM,
    note: "Migrated from V1 insurance amount. Frequency needs confirmation (monthly vs yearly)."
  },
  {
    field: "rent",
    title: "Rent",
    category: CommitmentCategory.RENT,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    priority: CommitmentPriority.HIGH,
    note: "Migrated from V1 rent."
  },
  {
    field: "utilityBills",
    title: "Utilities",
    category: CommitmentCategory.UTILITY,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    priority: CommitmentPriority.MEDIUM,
    note: "Migrated from V1 utility bills."
  },
  {
    field: "mandatoryExpenses",
    title: "Fixed expenses",
    category: CommitmentCategory.MANUAL_EXPENSE,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.CONFIRMED,
    priority: CommitmentPriority.MEDIUM,
    note: "Migrated from V1 mandatory expenses."
  },
  {
    field: "fixedCommitments",
    title: "Fixed commitments",
    category: CommitmentCategory.OTHER,
    frequency: CommitmentFrequency.MONTHLY,
    reviewStatus: CommitmentReviewStatus.NEEDS_REVIEW,
    priority: CommitmentPriority.MEDIUM,
    note: "Migrated from V1 fixed commitments. May include chit contributions — review to avoid duplicates."
  }
];

export function detectSchemaVersion(meta: SchemaMeta | null): DataSchemaVersionValue {
  if (!meta) {
    return DataSchemaVersion.V1;
  }

  return meta.schemaVersion;
}

/**
 * Pure V1 → V2 migration. Preserves MoneyBreakdown untouched (caller keeps it).
 * Idempotent when schema is already V2 with income/commitments present.
 */
export function migrateSchemaV1ToV2(input: SchemaMigrationInput): SchemaMigrationResult {
  const now = input.now ?? new Date().toISOString();
  const fromVersion = detectSchemaVersion(input.existingSchemaMeta);

  if (fromVersion === DataSchemaVersion.V2 && input.existingIncomeProfile) {
    const needsReviewCount = input.existingCommitments.filter(
      (item) => item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW
    ).length;

    return {
      migrated: false,
      fromVersion,
      toVersion: DataSchemaVersion.V2,
      incomeProfile: input.existingIncomeProfile,
      commitments: input.existingCommitments,
      schemaMeta: input.existingSchemaMeta ?? createSchemaMeta(DataSchemaVersion.V2, now, [], needsReviewCount),
      commitmentsCreated: 0,
      needsReviewCount,
      notes: [],
      message: "Schema is already V2."
    };
  }

  const notes: string[] = [];
  const money = input.moneyBreakdown;

  const incomeProfile = buildIncomeProfileFromV1(money, input.existingIncomeProfile, now, notes);
  const migratedCommitments = buildCommitmentsFromV1(money, now, notes);
  const commitments = mergeCommitments(input.existingCommitments, migratedCommitments);
  const commitmentsCreated = migratedCommitments.length;
  const needsReviewCount = commitments.filter(
    (item) => item.reviewStatus === CommitmentReviewStatus.NEEDS_REVIEW
  ).length;

  if (!money) {
    notes.push("No V1 money breakdown found. Income and commitments start empty.");
  }

  const schemaMeta = createSchemaMeta(DataSchemaVersion.V2, now, notes, needsReviewCount);

  return {
    migrated: true,
    fromVersion: DataSchemaVersion.V1,
    toVersion: DataSchemaVersion.V2,
    incomeProfile,
    commitments,
    schemaMeta,
    commitmentsCreated,
    needsReviewCount,
    notes,
    message:
      needsReviewCount > 0
        ? `Migrated to V2. ${needsReviewCount} commitment(s) need review.`
        : "Migrated to V2 successfully."
  };
}

function buildIncomeProfileFromV1(
  money: MoneyBreakdown | null,
  existing: IncomeProfile | null,
  now: string,
  notes: string[]
): IncomeProfile {
  if (existing) {
    return existing;
  }

  const monthlyIncome = Math.max(money?.monthlyIncome ?? 0, 0);
  const profile = createSimpleIncomeProfile(monthlyIncome, now);

  if (monthlyIncome > 0) {
    const primarySource: IncomeSource = {
      id: `income-primary-${now.slice(0, 10)}`,
      kind: IncomeSourceKind.SALARY,
      label: "Primary income",
      monthlyAmount: monthlyIncome,
      isPrimary: true,
      createdAt: now,
      updatedAt: now
    };
    profile.sources = [primarySource];
    notes.push("Monthly income mapped to primary income source (simple mode).");
  } else {
    notes.push("Monthly income was zero or missing — simple income profile created empty.");
  }

  profile.mode = IncomeMode.SIMPLE;
  return profile;
}

function buildCommitmentsFromV1(
  money: MoneyBreakdown | null,
  now: string,
  notes: string[]
): CommitmentRecord[] {
  if (!money) {
    return [];
  }

  const commitments: CommitmentRecord[] = [];
  const nextDueDate = firstDayOfNextMonth(now);

  for (const mapping of LEGACY_FIELD_MAPPINGS) {
    const amount = money[mapping.field];
    if (typeof amount !== "number" || amount <= 0) {
      continue;
    }

    commitments.push({
      id: `legacy-${mapping.field}`,
      title: mapping.title,
      category: mapping.category,
      amount,
      frequency: mapping.frequency,
      nextDueDate,
      priority: mapping.priority,
      source: {
        kind: CommitmentSourceKind.LEGACY_MIGRATED,
        legacyField: mapping.field
      },
      reviewStatus: mapping.reviewStatus,
      reminderEnabled: false,
      editable: true,
      notes: mapping.note,
      createdAt: now,
      updatedAt: now
    });

    notes.push(`Migrated ${mapping.field}=${amount} → "${mapping.title}" (${mapping.reviewStatus}).`);
  }

  return commitments;
}

function mergeCommitments(
  existing: CommitmentRecord[],
  migrated: CommitmentRecord[]
): CommitmentRecord[] {
  const byId = new Map<string, CommitmentRecord>();

  for (const item of existing) {
    byId.set(item.id, item);
  }

  for (const item of migrated) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }

  return [...byId.values()];
}

function createSchemaMeta(
  schemaVersion: DataSchemaVersionValue,
  migratedAt: string,
  migrationNotes: string[],
  needsReviewCount: number
): SchemaMeta {
  return {
    id: SCHEMA_META_ID,
    schemaVersion,
    migratedAt,
    migrationNotes,
    needsReviewCount
  };
}

function firstDayOfNextMonth(isoNow: string): string {
  const date = new Date(isoNow);
  if (Number.isNaN(date.getTime())) {
    return isoNow.slice(0, 10);
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

export { LEGACY_FIELD_MAPPINGS };
