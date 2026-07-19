/**
 * FCC Event Taxonomy — Migration & V2 domain events.
 */

export const MigrationEvents = {
  MIGRATION_STARTED: "MIGRATION_STARTED",
  MIGRATION_COMPLETED: "MIGRATION_COMPLETED",
  MIGRATION_FAILED: "MIGRATION_FAILED",
  LEGACY_COMMITMENT_REVIEWED: "LEGACY_COMMITMENT_REVIEWED",
  INCOME_SOURCE_ADDED: "INCOME_SOURCE_ADDED",
  COMMITMENT_CREATED: "COMMITMENT_CREATED",
  PRODUCT_CREATED: "PRODUCT_CREATED"
} as const;

export type MigrationEventName = (typeof MigrationEvents)[keyof typeof MigrationEvents];

export type MigrationEventPayloadMap = {
  MIGRATION_STARTED: { from_schema_version?: number; to_schema_version?: number };
  MIGRATION_COMPLETED: {
    from_schema_version?: number;
    to_schema_version?: number;
    commitments_created?: number;
    needs_review_count?: number;
  };
  MIGRATION_FAILED: { message?: string; from_schema_version?: number };
  LEGACY_COMMITMENT_REVIEWED: { commitment_id?: string };
  INCOME_SOURCE_ADDED: { income_source_id?: string };
  COMMITMENT_CREATED: { commitment_id?: string };
  PRODUCT_CREATED: { product_type?: string; product_id?: string };
};
