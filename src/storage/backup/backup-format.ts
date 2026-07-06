import type { FinanceDataSnapshot } from "@/shared/domain/finance";

export const BACKUP_SIGNATURE = "FinanceCommandCenter";
export const BACKUP_VERSION = "1.0";
export const BACKUP_APP_VERSION = "0.1.0";
export const BACKUP_PLATFORM = "PWA";

export interface FinanceCommandCenterBackupV1 {
  signature: typeof BACKUP_SIGNATURE;
  backupVersion: typeof BACKUP_VERSION;
  appVersion: string;
  createdAt: string;
  platform: typeof BACKUP_PLATFORM;
  encrypted: false;
  checksum: string;
  metadata: BackupMetadata;
  data: FinanceDataSnapshot;
  future: {
    encryption: "none";
    compression: "none";
    migrationPath: "direct";
  };
}

export interface BackupMetadata {
  loanCount: number;
  loanPaymentCount: number;
  upcomingDueCount: number;
  incomeSources: number;
  expenseCategories: number;
  hasProfile: boolean;
  hasMoneyBreakdown: boolean;
}

export interface BackupPreview {
  signature: typeof BACKUP_SIGNATURE;
  backupVersion: typeof BACKUP_VERSION;
  createdAt: string;
  appVersion: string;
  platform: typeof BACKUP_PLATFORM;
  encrypted: false;
  metadata: BackupMetadata;
}

export interface RestoredBackupSummary extends BackupPreview {
  snapshot: FinanceDataSnapshot;
}
