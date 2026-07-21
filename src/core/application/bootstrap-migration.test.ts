import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppEvent } from "@/core/analytics/events";
import type { SchemaMigrationResult } from "@/storage/migration";

const trackApplicationEvent = vi.fn();
const preloadFinanceData = vi.fn(async () => undefined);
const identifyAnalyticsUser = vi.fn();

vi.mock("@/core/analytics/track-application-event", () => ({
  trackApplicationEvent,
  reportApplicationError: vi.fn()
}));

vi.mock("@/repositories/finance-preload", () => ({
  preloadFinanceData
}));

vi.mock("@/core/analytics/analytics-identity", () => ({
  identifyAnalyticsUser
}));

describe("bootstrap schema migration analytics", () => {
  beforeEach(() => {
    trackApplicationEvent.mockClear();
    preloadFinanceData.mockClear();
    identifyAnalyticsUser.mockClear();
    vi.resetModules();
  });

  it("emits MIGRATION_STARTED then MIGRATION_COMPLETED via AppEvent constants", async () => {
    const { bootstrapApplication, resetApplicationServicesForTests } = await import(
      "@/core/application/application-container"
    );
    resetApplicationServicesForTests();

    const schemaResult: SchemaMigrationResult = {
      migrated: true,
      fromVersion: 1,
      toVersion: 2,
      commitmentsCreated: 3,
      needsReviewCount: 2,
      incomeProfile: null,
      commitments: [],
      schemaMeta: {
        id: "primary",
        schemaVersion: 2,
        migratedAt: "2026-07-19T00:00:00.000Z",
        migrationNotes: [],
        needsReviewCount: 2
      },
      notes: [],
      message: "Migrated"
    };

    await bootstrapApplication({
      analytics: { initialize: vi.fn(async () => undefined) },
      financeRepository: {
        initializeDatabase: vi.fn(async () => undefined),
        migrateFromLegacyStorage: vi.fn(async () => ({
          migrated: false,
          message: "noop"
        })),
        getSchemaMeta: vi.fn(async () => null),
        migrateDataSchema: vi.fn(async () => schemaResult),
        getProfile: vi.fn(async () => null)
      },
      errorService: { report: vi.fn() }
    } as never);

    expect(trackApplicationEvent).toHaveBeenCalledWith(AppEvent.MIGRATION_STARTED, {
      from_schema_version: 1,
      to_schema_version: 4
    });
    expect(trackApplicationEvent).toHaveBeenCalledWith(AppEvent.MIGRATION_COMPLETED, {
      from_schema_version: 1,
      to_schema_version: 2,
      commitments_created: 3,
      needs_review_count: 2
    });
  });

  it("emits MIGRATION_FAILED when schema migration throws", async () => {
    const { bootstrapApplication, resetApplicationServicesForTests } = await import(
      "@/core/application/application-container"
    );
    resetApplicationServicesForTests();

    const report = vi.fn();

    await bootstrapApplication({
      analytics: { initialize: vi.fn(async () => undefined) },
      financeRepository: {
        initializeDatabase: vi.fn(async () => undefined),
        migrateFromLegacyStorage: vi.fn(async () => ({
          migrated: false,
          message: "noop"
        })),
        getSchemaMeta: vi.fn(async () => null),
        migrateDataSchema: vi.fn(async () => {
          throw new Error("boom");
        }),
        getProfile: vi.fn(async () => null)
      },
      errorService: { report }
    } as never);

    expect(trackApplicationEvent).toHaveBeenCalledWith(AppEvent.MIGRATION_FAILED, {
      message: "boom",
      from_schema_version: 1
    });
    expect(report).toHaveBeenCalled();
  });

  it("wires bootstrap migration through AppEvent only (no magic strings)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/core/application/application-container.ts"),
      "utf8"
    );

    expect(source).toContain("AppEvent.MIGRATION_STARTED");
    expect(source).toContain("AppEvent.MIGRATION_COMPLETED");
    expect(source).toContain("AppEvent.MIGRATION_FAILED");
    expect(source).not.toContain('"MIGRATION_STARTED"');
    expect(source).not.toContain('"MIGRATION_COMPLETED"');
    expect(source).not.toContain('"MIGRATION_FAILED"');
  });

  it("keeps migrateDataSchema write scope off the moneyBreakdown store", () => {
    const source = readFileSync(
      join(process.cwd(), "src/repositories/indexeddb-finance-repository.ts"),
      "utf8"
    );
    const migrateBlock = source.slice(
      source.indexOf("async migrateDataSchema()"),
      source.indexOf("async clearDatabase()")
    );

    expect(migrateBlock).toContain('["incomeProfile", "commitments", "schemaMeta"]');
    expect(migrateBlock).not.toContain('"moneyBreakdown"');
  });
});
