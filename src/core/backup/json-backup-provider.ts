import type {
  BackupExportResult,
  BackupProvider,
  BackupRepositoryLike
} from "@/core/backup/backup-provider.interface";
import {
  createJsonBackup,
  inspectJsonBackup,
  restoreJsonBackup
} from "@/storage/backup/backup-service";

export function createJsonBackupProvider(): BackupProvider {
  return {
    async exportBackup(repository: BackupRepositoryLike): Promise<BackupExportResult> {
      const backup = await createJsonBackup({ repository });

      return {
        blob: backup.blob,
        filename: backup.filename,
        createdAt: backup.backup.createdAt
      };
    },

    inspectBackup(file: File) {
      return inspectJsonBackup(file);
    },

    restoreBackup(file: File, repository: BackupRepositoryLike) {
      return restoreJsonBackup({ file, repository });
    }
  };
}
