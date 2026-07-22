import type { BackupRepositoryLike } from "@/core/backup/backup-provider.interface";
import type { Chit } from "@/shared/domain/chit";
import type { CommitmentRecord } from "@/shared/domain/commitment-record";
import type { IncomeProfile } from "@/shared/domain/income";
import type {
  FinancialTimeline,
  FinancialTimelineSettings,
  TimelineActivity,
  TimelineEvent
} from "@/shared/domain/financial-timeline";
import { TIMELINE_SETTINGS_ID } from "@/shared/domain/financial-timeline";
import type {
  FinancialNotification,
  FinancialNotificationSettings,
  NotificationHistoryEntry
} from "@/notifications/models";
import { NOTIFICATION_SETTINGS_ID } from "@/notifications/models";
import type {
  FinanceDataSnapshot,
  Loan,
  LoanPayment,
  MoneyBreakdown,
  UpcomingDue,
  UserProfile
} from "@/shared/domain/finance";
import {
  BACKUP_APP_VERSION,
  BACKUP_PLATFORM,
  BACKUP_SIGNATURE,
  BACKUP_VERSION,
  type BackupMetadata,
  type BackupPreview,
  type FinanceCommandCenterBackupV1,
  type RestoredBackupSummary
} from "@/storage/backup/backup-format";

export async function createJsonBackup(params: { repository: BackupRepositoryLike }) {
  const snapshot = validateBackupData(await params.repository.createDataSnapshot());
  const createdAt = new Date().toISOString();
  const checksum = await createChecksum(snapshot);
  const backup: FinanceCommandCenterBackupV1 = {
    signature: BACKUP_SIGNATURE,
    backupVersion: BACKUP_VERSION,
    appVersion: BACKUP_APP_VERSION,
    createdAt,
    platform: BACKUP_PLATFORM,
    encrypted: false,
    checksum,
    metadata: createMetadata(snapshot),
    data: snapshot,
    future: {
      encryption: "none",
      compression: "none",
      migrationPath: "direct"
    }
  };

  return {
    blob: new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    }),
    filename: `finance-command-center-backup-${createdAt.slice(0, 10)}.json`,
    backup
  };
}

export async function inspectJsonBackup(file: File): Promise<BackupPreview> {
  const backup = await readAndValidateBackup(file);
  return createPreview(backup);
}

export async function restoreJsonBackup(params: {
  file: File;
  repository: BackupRepositoryLike;
}): Promise<RestoredBackupSummary> {
  const backup = await readAndValidateBackup(params.file);
  const snapshot = migrateBackupData(backup);

  await params.repository.replaceAllData(snapshot);

  return {
    ...createPreview(backup),
    snapshot
  };
}

async function readAndValidateBackup(file: File) {
  if (file.size === 0) {
    throw new Error("Backup file is empty.");
  }

  const rawText = await file.text();
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Invalid JSON backup file.");
  }

  const backup = validateBackupShape(parsed);
  await validateChecksum(backup);

  return backup;
}

function validateBackupShape(value: unknown): FinanceCommandCenterBackupV1 {
  if (!isRecord(value)) {
    throw new Error("Invalid backup file.");
  }

  if (value.signature !== BACKUP_SIGNATURE) {
    throw new Error("Invalid backup file.");
  }

  if (value.backupVersion !== BACKUP_VERSION) {
    if (typeof value.backupVersion === "string" && value.backupVersion > BACKUP_VERSION) {
      throw new Error("Backup belongs to a newer app version.");
    }

    throw new Error("Unsupported backup version.");
  }

  if (value.appVersion !== undefined && typeof value.appVersion !== "string") {
    throw new Error("Backup app version is invalid.");
  }

  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) {
    throw new Error("Backup timestamp is missing or invalid.");
  }

  if (value.platform !== BACKUP_PLATFORM) {
    throw new Error("Unsupported backup platform.");
  }

  if (value.encrypted !== false) {
    throw new Error("Encrypted backups are not supported in this version.");
  }

  if (typeof value.checksum !== "string" || !value.checksum) {
    throw new Error("Backup checksum is missing.");
  }

  if (!isRecord(value.metadata)) {
    throw new Error("Backup metadata is missing.");
  }

  const data = validateBackupData(value.data);

  return {
    signature: BACKUP_SIGNATURE,
    backupVersion: BACKUP_VERSION,
    appVersion: typeof value.appVersion === "string" ? value.appVersion : "unknown",
    createdAt: value.createdAt,
    platform: BACKUP_PLATFORM,
    encrypted: false,
    checksum: value.checksum,
    metadata: validateMetadata(value.metadata),
    data,
    future: {
      encryption: "none",
      compression: "none",
      migrationPath: "direct"
    }
  };
}

function validateBackupData(value: unknown): FinanceDataSnapshot {
  if (!isRecord(value)) {
    throw new Error("Backup data is missing.");
  }

  const schemaVersion = value.schemaVersion;
  if (schemaVersion !== 1 && schemaVersion !== 2 && schemaVersion !== 3 && schemaVersion !== 4) {
    throw new Error("Unsupported backup data schema.");
  }

  return {
    schemaVersion,
    exportedAt:
      typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    profile: isUserProfile(value.profile) ? value.profile : null,
    moneyBreakdown: isMoneyBreakdown(value.moneyBreakdown) ? value.moneyBreakdown : null,
    loans: readLoanArray(value.loans),
    loanPayments: readLoanPaymentArray(value.loanPayments),
    upcomingDues: readUpcomingDueArray(value.upcomingDues),
    chits: readChitArray(value.chits),
    incomeProfile: isIncomeProfile(value.incomeProfile) ? value.incomeProfile : null,
    commitments: readCommitmentArray(value.commitments),
    financialTimelines: readTimelineArray(value.financialTimelines),
    timelineEvents: readTimelineEventArray(value.timelineEvents),
    timelineActivities: readTimelineActivityArray(value.timelineActivities),
    timelineSettings: isTimelineSettings(value.timelineSettings) ? value.timelineSettings : undefined,
    notificationQueue: readNotificationQueueArray(value.notificationQueue),
    notificationHistory: readNotificationHistoryArray(value.notificationHistory),
    notificationSettings: isNotificationSettings(value.notificationSettings)
      ? value.notificationSettings
      : undefined
  };
}

function validateMetadata(value: Record<string, unknown>): BackupMetadata {
  return {
    loanCount: readNumber(value.loanCount),
    loanPaymentCount: readNumber(value.loanPaymentCount),
    upcomingDueCount: readNumber(value.upcomingDueCount),
    incomeSources: readNumber(value.incomeSources),
    expenseCategories: readNumber(value.expenseCategories),
    hasProfile: Boolean(value.hasProfile),
    hasMoneyBreakdown: Boolean(value.hasMoneyBreakdown)
  };
}

async function validateChecksum(backup: FinanceCommandCenterBackupV1) {
  const checksum = await createChecksum(backup.data);

  if (checksum !== backup.checksum) {
    throw new Error("Corrupted backup. Checksum does not match.");
  }
}

function migrateBackupData(backup: FinanceCommandCenterBackupV1): FinanceDataSnapshot {
  if (backup.backupVersion !== "1.0") {
    throw new Error("Unsupported backup version.");
  }

  // Detect schema inside data payload; V1→V2 upgrade runs after replace via repository.migrateDataSchema().
  return backup.data;
}

function createPreview(backup: FinanceCommandCenterBackupV1): BackupPreview {
  return {
    signature: backup.signature,
    backupVersion: backup.backupVersion,
    createdAt: backup.createdAt,
    appVersion: backup.appVersion,
    platform: backup.platform,
    encrypted: backup.encrypted,
    metadata: backup.metadata
  };
}

function createMetadata(snapshot: FinanceDataSnapshot): BackupMetadata {
  return {
    loanCount: snapshot.loans.length,
    loanPaymentCount: snapshot.loanPayments.length,
    upcomingDueCount: snapshot.upcomingDues.length,
    incomeSources: snapshot.incomeProfile?.sources.length
      ? snapshot.incomeProfile.sources.length
      : snapshot.moneyBreakdown?.monthlyIncome
        ? 1
        : 0,
    expenseCategories: countExpenseCategories(snapshot),
    hasProfile: Boolean(snapshot.profile),
    hasMoneyBreakdown: Boolean(snapshot.moneyBreakdown)
  };
}

function countExpenseCategories(snapshot: FinanceDataSnapshot) {
  const breakdown = snapshot.moneyBreakdown;

  if (!breakdown) {
    return 0;
  }

  return [
    breakdown.mandatoryExpenses,
    breakdown.emis,
    breakdown.loanPayments,
    breakdown.insurance,
    breakdown.rent,
    breakdown.utilityBills,
    breakdown.fixedCommitments
  ].filter((value) => value > 0).length;
}

async function createChecksum(snapshot: FinanceDataSnapshot) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUserProfile(value: unknown): value is UserProfile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    typeof value.onboardingCompleted === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isMoneyBreakdown(value: unknown): value is MoneyBreakdown {
  return (
    isRecord(value) &&
    typeof value.monthlyIncome === "number" &&
    typeof value.mandatoryExpenses === "number" &&
    typeof value.emis === "number" &&
    typeof value.loanPayments === "number" &&
    typeof value.insurance === "number" &&
    typeof value.rent === "number" &&
    typeof value.utilityBills === "number" &&
    typeof value.fixedCommitments === "number" &&
    typeof value.emergencyBuffer === "number"
  );
}

function isLoan(value: unknown): value is Loan {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    typeof value.lender === "string" &&
    typeof value.originalAmount === "number" &&
    typeof value.outstandingBalance === "number" &&
    typeof value.annualInterestRate === "number" &&
    typeof value.monthlyEmi === "number" &&
    typeof value.principalPaid === "number" &&
    typeof value.interestPaid === "number" &&
    typeof value.remainingTenureMonths === "number" &&
    typeof value.estimatedClosureDate === "string" &&
    typeof value.nextDueDate === "string"
  );
}

function isLoanPayment(value: unknown): value is LoanPayment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.loanId === "string" &&
    typeof value.kind === "string" &&
    typeof value.amount === "number" &&
    typeof value.principalAmount === "number" &&
    typeof value.interestAmount === "number" &&
    typeof value.paidOn === "string"
  );
}

function isUpcomingDue(value: unknown): value is UpcomingDue {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.dueDate === "string" &&
    typeof value.amount === "number" &&
    typeof value.source === "string"
  );
}

function isChit(value: unknown): value is Chit {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.providerType === "string" &&
    typeof value.providerName === "string" &&
    typeof value.chitName === "string" &&
    typeof value.chitValue === "number" &&
    typeof value.monthlyContribution === "number" &&
    typeof value.totalDurationMonths === "number" &&
    typeof value.startDate === "string" &&
    typeof value.currentRunningMonth === "number" &&
    typeof value.prizeReceived === "boolean" &&
    typeof value.nextDueDate === "string" &&
    typeof value.status === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function readChitArray(value: unknown): Chit[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup chits data is invalid.");
  }

  return value.map((item, index) => {
    if (!isChit(item)) {
      throw new Error(`Invalid chit at index ${index}.`);
    }

    return item;
  });
}

function readLoanArray(value: unknown): Loan[] {
  if (!Array.isArray(value)) {
    throw new Error("Backup is missing loans data.");
  }

  return value.map((item, index) => {
    if (!isLoan(item)) {
      throw new Error(`Invalid loan at index ${index}.`);
    }

    return item;
  });
}

function readLoanPaymentArray(value: unknown): LoanPayment[] {
  if (!Array.isArray(value)) {
    throw new Error("Backup is missing payment history.");
  }

  return value.map((item, index) => {
    if (!isLoanPayment(item)) {
      throw new Error(`Invalid loan payment at index ${index}.`);
    }

    return item;
  });
}

function readUpcomingDueArray(value: unknown): UpcomingDue[] {
  if (!Array.isArray(value)) {
    throw new Error("Backup is missing upcoming dues.");
  }

  return value.map((item, index) => {
    if (!isUpcomingDue(item)) {
      throw new Error(`Invalid upcoming due at index ${index}.`);
    }

    return item;
  });
}

function isIncomeProfile(value: unknown): value is IncomeProfile {
  return (
    isRecord(value) &&
    (value.mode === "simple" || value.mode === "advanced") &&
    typeof value.simpleMonthlyIncome === "number" &&
    Array.isArray(value.sources) &&
    typeof value.updatedAt === "string"
  );
}

function isCommitmentRecord(value: unknown): value is CommitmentRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.category === "string" &&
    typeof value.amount === "number" &&
    typeof value.frequency === "string" &&
    typeof value.nextDueDate === "string" &&
    typeof value.priority === "string" &&
    isRecord(value.source) &&
    typeof value.source.kind === "string" &&
    typeof value.reviewStatus === "string" &&
    typeof value.reminderEnabled === "boolean" &&
    typeof value.editable === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function readCommitmentArray(value: unknown): CommitmentRecord[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup commitments data is invalid.");
  }

  return value.map((item, index) => {
    if (!isCommitmentRecord(item)) {
      throw new Error(`Invalid commitment at index ${index}.`);
    }

    return item;
  });
}

function readTimelineArray(value: unknown): FinancialTimeline[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup financial timelines data is invalid.");
  }

  return value as FinancialTimeline[];
}

function readTimelineEventArray(value: unknown): TimelineEvent[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup timeline events data is invalid.");
  }

  return value as TimelineEvent[];
}

function readTimelineActivityArray(value: unknown): TimelineActivity[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup timeline activities data is invalid.");
  }

  return value as TimelineActivity[];
}

function isTimelineSettings(value: unknown): value is FinancialTimelineSettings {
  return (
    isRecord(value) &&
    value.id === TIMELINE_SETTINGS_ID &&
    typeof value.defaultConfirmationMode === "string" &&
    typeof value.smartAutoThreshold === "number" &&
    typeof value.pendingReminderDays === "number" &&
    typeof value.reviewOverdueDays === "number" &&
    typeof value.showFreshnessIndicator === "boolean" &&
    typeof value.updatedAt === "string"
  );
}

function readNotificationQueueArray(value: unknown): FinancialNotification[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup notification queue data is invalid.");
  }

  return value as FinancialNotification[];
}

function readNotificationHistoryArray(value: unknown): NotificationHistoryEntry[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error("Backup notification history data is invalid.");
  }

  return value as NotificationHistoryEntry[];
}

function isNotificationSettings(value: unknown): value is FinancialNotificationSettings {
  return (
    isRecord(value) &&
    value.id === NOTIFICATION_SETTINGS_ID &&
    typeof value.enabled === "boolean" &&
    (typeof value.activeProviderId === "string" || typeof value.defaultProviderId === "string") &&
    typeof value.privacyLevel === "string" &&
    typeof value.updatedAt === "string"
  );
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
