/**
 * FCC data schema versioning.
 * V1 = screen-driven model (MoneyBreakdown flat fields).
 * V2 = domain-driven model (IncomeProfile, CommitmentRecord) alongside V1 fields.
 */

export const DataSchemaVersion = {
  V1: 1,
  V2: 2,
  V3: 3,
  V4: 4
} as const;

export type DataSchemaVersionValue = (typeof DataSchemaVersion)[keyof typeof DataSchemaVersion];

/** Live schema version after Financial Notification System migration. */
export const CURRENT_DATA_SCHEMA_VERSION: DataSchemaVersionValue = DataSchemaVersion.V4;

export function isKnownSchemaVersion(value: number): value is DataSchemaVersionValue {
  return (
    value === DataSchemaVersion.V1 ||
    value === DataSchemaVersion.V2 ||
    value === DataSchemaVersion.V3 ||
    value === DataSchemaVersion.V4
  );
}

export const SCHEMA_META_ID = "primary" as const;

export interface SchemaMeta {
  id: typeof SCHEMA_META_ID;
  schemaVersion: DataSchemaVersionValue;
  migratedAt: string | null;
  /** Human-readable notes for lightweight migration review UI. */
  migrationNotes: string[];
  needsReviewCount: number;
}
