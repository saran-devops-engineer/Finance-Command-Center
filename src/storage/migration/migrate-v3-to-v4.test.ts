import { describe, expect, it } from "vitest";
import { migrateSchemaV3ToV4 } from "@/storage/migration/migrate-v3-to-v4";
import { DataSchemaVersion } from "@/shared/domain/schema-version";
import { NOTIFICATION_SETTINGS_ID } from "@/notifications/models";

describe("migrateSchemaV3ToV4", () => {
  it("creates default notification settings", () => {
    const result = migrateSchemaV3ToV4({
      existingSchemaMeta: null,
      existingSettings: null,
      now: "2026-07-21T12:00:00.000Z"
    });

    expect(result.migrated).toBe(true);
    expect(result.settings.id).toBe(NOTIFICATION_SETTINGS_ID);
    expect(result.schemaMeta.schemaVersion).toBe(DataSchemaVersion.V4);
  });
});
