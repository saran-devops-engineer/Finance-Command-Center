import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AppEvent,
  EVENT_BUSINESS_QUESTIONS,
  EVENT_CATEGORIES,
  TAXONOMY_EVENT_COUNT,
  UNUSED_TAXONOMY_EVENTS
} from "@/core/analytics/events";

const SRC_ROOT = join(process.cwd(), "src");
const ALLOWED_MAGIC_STRING_FILES = new Set([
  "core/analytics/events",
  "core/analytics/posthog-provider.ts",
  "core/analytics/posthog-provider.test.ts",
  "core/analytics/analytics-service.ts",
  "core/analytics/noop-analytics-provider.ts",
  "core/analytics/event-taxonomy.test.ts",
  "core/architecture.test.ts"
]);

function walkFiles(directory: string, files: string[] = []) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkFiles(fullPath, files);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

function relativeSrcPath(filePath: string) {
  return relative(SRC_ROOT, filePath).replaceAll("\\", "/");
}

function isAllowedMagicStringFile(relativePath: string) {
  if (ALLOWED_MAGIC_STRING_FILES.has(relativePath)) {
    return true;
  }

  return relativePath.startsWith("core/analytics/events/");
}

describe("FCC Event Taxonomy V1", () => {
  it("defines the frozen event catalog", () => {
    expect(TAXONOMY_EVENT_COUNT).toBe(58);
    expect(Object.keys(AppEvent)).toHaveLength(TAXONOMY_EVENT_COUNT);
    expect(Object.keys(EVENT_CATEGORIES)).toHaveLength(TAXONOMY_EVENT_COUNT);
    expect(Object.keys(EVENT_BUSINESS_QUESTIONS)).toHaveLength(TAXONOMY_EVENT_COUNT);
  });

  it("documents unused taxonomy events", () => {
    expect(UNUSED_TAXONOMY_EVENTS).toEqual([
      "APP_UPDATED",
      "APP_CLOSED",
      "ONBOARDING_SKIPPED",
      "FORECLOSURE_USED",
      "THEME_CHANGED",
      "ANALYTICS_CHANGED",
      "FEEDBACK_SUBMITTED"
    ]);
  });

  it("includes schema migration events in the frozen catalog", () => {
    expect(AppEvent.MIGRATION_STARTED).toBe("MIGRATION_STARTED");
    expect(AppEvent.MIGRATION_COMPLETED).toBe("MIGRATION_COMPLETED");
    expect(AppEvent.MIGRATION_FAILED).toBe("MIGRATION_FAILED");
    expect(EVENT_CATEGORIES.MIGRATION_STARTED).toBe("Migration");
    expect(EVENT_BUSINESS_QUESTIONS.MIGRATION_COMPLETED).toContain("schema migrations");
  });

  it("forbids hardcoded analytics event strings outside the taxonomy", () => {
    const violations: string[] = [];
    const taxonomyValues = new Set(Object.values(AppEvent));
    const trackCallPattern = /\.track\s*\(\s*["'`]/g;
    const captureCallPattern = /capture\s*\(\s*["'`]/g;

    for (const filePath of walkFiles(SRC_ROOT)) {
      const relativePath = relativeSrcPath(filePath);

      if (isAllowedMagicStringFile(relativePath)) {
        continue;
      }

      const contents = readFileSync(filePath, "utf8");

      for (const pattern of [trackCallPattern, captureCallPattern]) {
        pattern.lastIndex = 0;

        if (pattern.test(contents)) {
          violations.push(relativePath);
          break;
        }
      }

      for (const eventName of taxonomyValues) {
        if (contents.includes(`"${eventName}"`) && !contents.includes(`AppEvent.${eventName}`)) {
          if (!relativePath.includes("EVENT_TAXONOMY.md")) {
            violations.push(`${relativePath} (${eventName})`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
