import type { FinanceDataSnapshot } from "@/shared/domain/finance";

export const FCC_BACKUP_MAGIC = "FCC_BACKUP";
export const FCC_BACKUP_FILE_VERSION = 1;
export const FCC_BACKUP_SCHEMA_VERSION = 1;
export const FCC_BACKUP_APP_VERSION = "0.1.0";

export interface FccBackupEnvelopeV1 {
  magic: typeof FCC_BACKUP_MAGIC;
  fileVersion: typeof FCC_BACKUP_FILE_VERSION;
  appVersion: string;
  createdAt: string;
  backupId: string;
  schemaVersion: typeof FCC_BACKUP_SCHEMA_VERSION;
  compression: "none";
  encryption: {
    algorithm: "AES-GCM";
    keyLength: 256;
    iv: string;
    kdf: "PBKDF2";
    salt: string;
    iterations: number;
    hash: "SHA-256";
  };
  payload: string;
  integrity: {
    payloadHash: string;
  };
  metadata: {
    recordCounts: {
      loans: number;
      loanPayments: number;
      upcomingDues: number;
    };
  };
}

export interface RestoredBackupSummary {
  backupId: string;
  createdAt: string;
  appVersion: string;
  recordCounts: FccBackupEnvelopeV1["metadata"]["recordCounts"];
  snapshot: FinanceDataSnapshot;
}
