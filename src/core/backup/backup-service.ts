import type { FinanceRepository } from "@/core/repository/finance-repository";
import type {
  BackupExportResult,
  BackupProvider
} from "@/core/backup/backup-provider.interface";
import type { BackupPreview, RestoredBackupSummary } from "@/storage/backup/backup-format";

export class BackupService {
  constructor(
    private readonly provider: BackupProvider,
    private readonly repository: FinanceRepository
  ) {}

  exportBackup(): Promise<BackupExportResult> {
    return this.provider.exportBackup(this.repository);
  }

  inspectBackup(file: File): Promise<BackupPreview> {
    return this.provider.inspectBackup(file);
  }

  restoreBackup(file: File): Promise<RestoredBackupSummary> {
    return this.provider.restoreBackup(file, this.repository);
  }
}

export function createBackupService(provider: BackupProvider, repository: FinanceRepository) {
  return new BackupService(provider, repository);
}
