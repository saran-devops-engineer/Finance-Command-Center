/** Backup — answers: Are users protecting their data? */
export const BackupEvents = {
  BACKUP_CREATED: "BACKUP_CREATED",
  BACKUP_RESTORED: "BACKUP_RESTORED",
  EXPORT_JSON: "EXPORT_JSON",
  IMPORT_JSON: "IMPORT_JSON"
} as const;

export type BackupEventName = (typeof BackupEvents)[keyof typeof BackupEvents];

export interface BackupEventPayloadMap {
  BACKUP_CREATED: { filename: string };
  BACKUP_RESTORED: undefined;
  EXPORT_JSON: undefined;
  IMPORT_JSON: undefined;
}
