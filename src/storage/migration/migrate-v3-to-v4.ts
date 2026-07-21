/**
 * V3 → V4 schema migration — initializes Financial Notification System stores.
 * Idempotent when notification settings already exist.
 */

import {
  DataSchemaVersion,
  SCHEMA_META_ID,
  type DataSchemaVersionValue,
  type SchemaMeta
} from "@/shared/domain/schema-version";
import type { FinancialNotificationSettings } from "@/notifications/models";
import { DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS } from "@/notifications/settings/defaults";

export interface SchemaV4MigrationInput {
  existingSchemaMeta: SchemaMeta | null;
  existingSettings: FinancialNotificationSettings | null;
  now?: string;
}

export interface SchemaV4MigrationResult {
  migrated: boolean;
  fromVersion: DataSchemaVersionValue;
  toVersion: DataSchemaVersionValue;
  settings: FinancialNotificationSettings;
  schemaMeta: SchemaMeta;
  notes: string[];
  message: string;
}

export function migrateSchemaV3ToV4(input: SchemaV4MigrationInput): SchemaV4MigrationResult {
  const now = input.now ?? new Date().toISOString();
  const fromVersion = input.existingSchemaMeta?.schemaVersion ?? DataSchemaVersion.V3;

  if (fromVersion >= DataSchemaVersion.V4 && input.existingSettings) {
    return {
      migrated: false,
      fromVersion,
      toVersion: DataSchemaVersion.V4,
      settings: input.existingSettings,
      schemaMeta: input.existingSchemaMeta ?? createV4SchemaMeta(now, []),
      notes: [],
      message: "Financial Notification System already initialized."
    };
  }

  const settings: FinancialNotificationSettings = input.existingSettings ?? {
    ...DEFAULT_FINANCIAL_NOTIFICATION_SETTINGS,
    updatedAt: now
  };

  const notes = ["Initialized Financial Notification System settings."];

  return {
    migrated: true,
    fromVersion,
    toVersion: DataSchemaVersion.V4,
    settings,
    schemaMeta: createV4SchemaMeta(now, notes),
    notes,
    message: "Financial Notification System initialized."
  };
}

function createV4SchemaMeta(now: string, notes: string[]): SchemaMeta {
  return {
    id: SCHEMA_META_ID,
    schemaVersion: DataSchemaVersion.V4,
    migratedAt: now,
    migrationNotes: notes,
    needsReviewCount: 0
  };
}
