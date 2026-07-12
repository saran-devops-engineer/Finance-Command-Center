export type {
  BackupMetadata,
  BackupPreview,
  FinanceCommandCenterBackupV1,
  RestoredBackupSummary
} from "@/storage/backup/backup-format";

export {
  BACKUP_APP_VERSION,
  BACKUP_PLATFORM,
  BACKUP_SIGNATURE,
  BACKUP_VERSION
} from "@/storage/backup/backup-format";

import type { FinanceDataSnapshot } from "@/shared/domain/finance";
import type {
  BackupPreview,
  RestoredBackupSummary
} from "@/storage/backup/backup-format";

export interface BackupExportResult {
  blob: Blob;
  filename: string;
  createdAt: string;
}

export interface BackupProvider {
  exportBackup(repository: BackupRepositoryLike): Promise<BackupExportResult>;
  inspectBackup(file: File): Promise<BackupPreview>;
  restoreBackup(file: File, repository: BackupRepositoryLike): Promise<RestoredBackupSummary>;
}

export interface BackupRepositoryLike {
  createDataSnapshot(): Promise<FinanceDataSnapshot>;
  replaceAllData(value: FinanceDataSnapshot): Promise<void>;
}
