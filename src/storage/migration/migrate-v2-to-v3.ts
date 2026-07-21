/**
 * V2 → V3 schema migration — bootstraps Financial Timeline for existing products.
 * Never deletes V1/V2 financial data. Idempotent when timelines already exist.
 */

import {
  DataSchemaVersion,
  SCHEMA_META_ID,
  type DataSchemaVersionValue,
  type SchemaMeta
} from "@/shared/domain/schema-version";
import type { Chit } from "@/shared/domain/chit";
import type { Loan, LoanPayment } from "@/shared/domain/finance";
import type {
  FinancialTimeline,
  FinancialTimelineSettings,
  TimelineActivity,
  TimelineEvent
} from "@/shared/domain/financial-timeline";
import { migrateProductsToFinancialTimelines } from "@/engines/financial-timeline/migration/bootstrap-timeline";
import { DEFAULT_FINANCIAL_TIMELINE_SETTINGS } from "@/engines/financial-timeline/settings/defaults";

export interface SchemaV3MigrationInput {
  loans: Loan[];
  loanPayments: LoanPayment[];
  chits: Chit[];
  existingTimelines: FinancialTimeline[];
  existingSchemaMeta: SchemaMeta | null;
  existingSettings: FinancialTimelineSettings | null;
  now?: string;
}

export interface SchemaV3MigrationResult {
  migrated: boolean;
  fromVersion: DataSchemaVersionValue;
  toVersion: DataSchemaVersionValue;
  timelines: FinancialTimeline[];
  events: TimelineEvent[];
  activities: TimelineActivity[];
  settings: FinancialTimelineSettings;
  schemaMeta: SchemaMeta;
  notes: string[];
  message: string;
}

export function migrateSchemaV2ToV3(input: SchemaV3MigrationInput): SchemaV3MigrationResult {
  const now = input.now ?? new Date().toISOString();
  const fromVersion = input.existingSchemaMeta?.schemaVersion ?? DataSchemaVersion.V2;

  if (fromVersion >= DataSchemaVersion.V3 && input.existingTimelines.length > 0) {
    return {
      migrated: false,
      fromVersion,
      toVersion: DataSchemaVersion.V3,
      timelines: input.existingTimelines,
      events: [],
      activities: [],
      settings: input.existingSettings ?? {
        ...DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
        updatedAt: now
      },
      schemaMeta: input.existingSchemaMeta ?? createV3SchemaMeta(now, []),
      notes: [],
      message: "Financial Timeline already initialized."
    };
  }

  const bootstrap = migrateProductsToFinancialTimelines({
    loans: input.loans,
    loanPayments: input.loanPayments,
    chits: input.chits,
    nowIso: now
  });

  const settings: FinancialTimelineSettings = input.existingSettings ?? {
    ...DEFAULT_FINANCIAL_TIMELINE_SETTINGS,
    updatedAt: now
  };

  const schemaMeta = createV3SchemaMeta(now, bootstrap.notes);

  return {
    migrated: bootstrap.migrated,
    fromVersion,
    toVersion: DataSchemaVersion.V3,
    timelines: bootstrap.timelines,
    events: bootstrap.events,
    activities: bootstrap.activities,
    settings,
    schemaMeta,
    notes: bootstrap.notes,
    message: bootstrap.migrated
      ? `Bootstrapped ${bootstrap.timelines.length} financial timelines.`
      : "No products found for timeline bootstrap."
  };
}

function createV3SchemaMeta(now: string, notes: string[]): SchemaMeta {
  return {
    id: SCHEMA_META_ID,
    schemaVersion: DataSchemaVersion.V3,
    migratedAt: now,
    migrationNotes: notes,
    needsReviewCount: 0
  };
}
