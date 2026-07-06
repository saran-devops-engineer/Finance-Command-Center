import type { FinanceRepository } from "@/repositories/finance-repository";
import type { FinanceDataSnapshot } from "@/shared/domain/finance";
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

export async function createJsonBackup(params: { repository: FinanceRepository }) {
  const snapshot = await params.repository.createDataSnapshot();
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
  repository: FinanceRepository;
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

  if (value.schemaVersion !== 1) {
    throw new Error("Unsupported backup data schema.");
  }

  if (!Array.isArray(value.loans)) {
    throw new Error("Backup is missing loans data.");
  }

  if (!Array.isArray(value.loanPayments)) {
    throw new Error("Backup is missing payment history.");
  }

  if (!Array.isArray(value.upcomingDues)) {
    throw new Error("Backup is missing upcoming dues.");
  }

  return {
    schemaVersion: 1,
    exportedAt:
      typeof value.exportedAt === "string" ? value.exportedAt : new Date().toISOString(),
    profile: isRecord(value.profile) ? (value.profile as FinanceDataSnapshot["profile"]) : null,
    moneyBreakdown: isRecord(value.moneyBreakdown)
      ? (value.moneyBreakdown as FinanceDataSnapshot["moneyBreakdown"])
      : null,
    loans: value.loans as FinanceDataSnapshot["loans"],
    loanPayments: value.loanPayments as FinanceDataSnapshot["loanPayments"],
    upcomingDues: value.upcomingDues as FinanceDataSnapshot["upcomingDues"]
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
  if (backup.backupVersion === "1.0") {
    return backup.data;
  }

  throw new Error("Unsupported backup version.");
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
    incomeSources: snapshot.moneyBreakdown?.monthlyIncome ? 1 : 0,
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

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
