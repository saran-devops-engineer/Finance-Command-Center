import type { FinanceRepository } from "@/repositories/finance-repository";
import type { FinanceDataSnapshot } from "@/shared/domain/finance";
import {
  FCC_BACKUP_APP_VERSION,
  FCC_BACKUP_FILE_VERSION,
  FCC_BACKUP_MAGIC,
  FCC_BACKUP_SCHEMA_VERSION,
  type FccBackupEnvelopeV1,
  type RestoredBackupSummary
} from "@/storage/backup/backup-format";
import {
  base64ToBytes,
  bytesToBase64,
  bytesToUtf8,
  DEFAULT_PBKDF2_ITERATIONS,
  decryptBytes,
  encryptBytes,
  randomBytes,
  sha256Base64,
  utf8ToBytes
} from "@/storage/backup/encryption";

export async function createEncryptedBackup(params: {
  repository: FinanceRepository;
  password: string;
}) {
  assertPassword(params.password);

  const snapshot = await params.repository.createDataSnapshot();
  const payloadBytes = utf8ToBytes(JSON.stringify(snapshot));
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const encryptedPayload = new Uint8Array(
    await encryptBytes({
      bytes: payloadBytes,
      password: params.password,
      salt,
      iv,
      iterations: DEFAULT_PBKDF2_ITERATIONS
    })
  );

  const createdAt = new Date().toISOString();
  const envelope: FccBackupEnvelopeV1 = {
    magic: FCC_BACKUP_MAGIC,
    fileVersion: FCC_BACKUP_FILE_VERSION,
    appVersion: FCC_BACKUP_APP_VERSION,
    createdAt,
    backupId: crypto.randomUUID(),
    schemaVersion: FCC_BACKUP_SCHEMA_VERSION,
    compression: "none",
    encryption: {
      algorithm: "AES-GCM",
      keyLength: 256,
      iv: bytesToBase64(iv),
      kdf: "PBKDF2",
      salt: bytesToBase64(salt),
      iterations: DEFAULT_PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    payload: bytesToBase64(encryptedPayload),
    integrity: {
      payloadHash: await sha256Base64(encryptedPayload)
    },
    metadata: {
      recordCounts: {
        loans: snapshot.loans.length,
        loanPayments: snapshot.loanPayments.length,
        upcomingDues: snapshot.upcomingDues.length
      }
    }
  };

  return {
    blob: new Blob([JSON.stringify(envelope, null, 2)], {
      type: "application/vnd.finance-command-center.backup"
    }),
    filename: `finance-command-center-${createdAt.slice(0, 10)}.fcc`,
    envelope
  };
}

export async function inspectEncryptedBackup(file: File): Promise<FccBackupEnvelopeV1> {
  const envelope = parseEnvelope(await file.text());
  await verifyEnvelopeIntegrity(envelope);
  return envelope;
}

export async function restoreEncryptedBackup(params: {
  file: File;
  password: string;
  repository: FinanceRepository;
}): Promise<RestoredBackupSummary> {
  assertPassword(params.password);

  const envelope = parseEnvelope(await params.file.text());
  await verifyEnvelopeIntegrity(envelope);

  const decryptedBytes = await decryptBytes({
    encryptedBytes: base64ToBytes(envelope.payload),
    password: params.password,
    salt: base64ToBytes(envelope.encryption.salt),
    iv: base64ToBytes(envelope.encryption.iv),
    iterations: envelope.encryption.iterations
  });
  const snapshot = parseSnapshot(bytesToUtf8(decryptedBytes));

  await params.repository.replaceAllData(snapshot);

  return {
    backupId: envelope.backupId,
    createdAt: envelope.createdAt,
    appVersion: envelope.appVersion,
    recordCounts: envelope.metadata.recordCounts,
    snapshot
  };
}

function assertPassword(password: string) {
  if (password.trim().length < 8) {
    throw new Error("Use a backup password with at least 8 characters.");
  }
}

function parseEnvelope(value: string): FccBackupEnvelopeV1 {
  const parsed = JSON.parse(value) as Partial<FccBackupEnvelopeV1>;

  if (parsed.magic !== FCC_BACKUP_MAGIC) {
    throw new Error("This is not a Finance Command Center backup file.");
  }

  if (parsed.fileVersion !== FCC_BACKUP_FILE_VERSION) {
    throw new Error("This backup file version is not supported yet.");
  }

  if (parsed.schemaVersion !== FCC_BACKUP_SCHEMA_VERSION) {
    throw new Error("This backup schema version is not supported yet.");
  }

  if (
    parsed.encryption?.algorithm !== "AES-GCM" ||
    parsed.encryption.kdf !== "PBKDF2" ||
    !parsed.payload ||
    !parsed.integrity?.payloadHash
  ) {
    throw new Error("This backup file is missing required encryption metadata.");
  }

  return parsed as FccBackupEnvelopeV1;
}

async function verifyEnvelopeIntegrity(envelope: FccBackupEnvelopeV1) {
  const payloadBytes = base64ToBytes(envelope.payload);
  const payloadHash = await sha256Base64(payloadBytes);

  if (payloadHash !== envelope.integrity.payloadHash) {
    throw new Error("Backup file appears corrupted or incomplete.");
  }
}

function parseSnapshot(value: string): FinanceDataSnapshot {
  const snapshot = JSON.parse(value) as Partial<FinanceDataSnapshot>;

  if (snapshot.schemaVersion !== FCC_BACKUP_SCHEMA_VERSION) {
    throw new Error("Unsupported backup data schema.");
  }

  if (
    !Array.isArray(snapshot.loans) ||
    !Array.isArray(snapshot.loanPayments) ||
    !Array.isArray(snapshot.upcomingDues)
  ) {
    throw new Error("Backup data is incomplete.");
  }

  return {
    schemaVersion: FCC_BACKUP_SCHEMA_VERSION,
    exportedAt: snapshot.exportedAt ?? new Date().toISOString(),
    profile: snapshot.profile ?? null,
    moneyBreakdown: snapshot.moneyBreakdown ?? null,
    loans: snapshot.loans,
    loanPayments: snapshot.loanPayments,
    upcomingDues: snapshot.upcomingDues
  };
}
