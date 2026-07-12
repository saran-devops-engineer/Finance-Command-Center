import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");
const FORBIDDEN_FETCH_DIRS = ["features", "services", "engines", "components", "hooks", "lib"];
const ALLOWED_FETCH_FILES = new Set([
  "core/api/rest-api-provider.ts",
  "core/architecture.test.ts"
]);
const FORBIDDEN_IDB_IMPORT_DIRS = ["features", "services", "engines", "components", "hooks", "lib"];
const ALLOWED_IDB_FILES = new Set([
  "repositories/indexeddb-finance-repository.ts",
  "storage/indexeddb/database.ts",
  "core/providers/provider-factory.ts",
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

function isUnder(relativePath: string, directory: string) {
  return relativePath.startsWith(`${directory}/`) || relativePath === directory;
}

describe("Core Architecture boundaries", () => {
  const sourceFiles = walkFiles(SRC_ROOT);

  it("allows fetch() only inside the API provider", () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = relativeSrcPath(filePath);
      const contents = readFileSync(filePath, "utf8");

      if (!contents.includes("fetch(")) {
        continue;
      }

      if (ALLOWED_FETCH_FILES.has(relativePath)) {
        continue;
      }

      if (FORBIDDEN_FETCH_DIRS.some((directory) => isUnder(relativePath, directory))) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("allows IndexedDB access only through repository/storage providers", () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = relativeSrcPath(filePath);
      const contents = readFileSync(filePath, "utf8");

      if (!contents.includes("@/storage/indexeddb/database")) {
        continue;
      }

      if (ALLOWED_IDB_FILES.has(relativePath)) {
        continue;
      }

      if (FORBIDDEN_IDB_IMPORT_DIRS.some((directory) => isUnder(relativePath, directory))) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });

  it("allows PostHog SDK imports only inside PostHogProvider", () => {
    const violations: string[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = relativeSrcPath(filePath);
      const contents = readFileSync(filePath, "utf8");

      if (!contents.includes("posthog-js")) {
        continue;
      }

      if (
        relativePath === "core/analytics/posthog-provider.ts" ||
        relativePath === "core/analytics/posthog-provider.test.ts" ||
        relativePath === "core/architecture.test.ts"
      ) {
        continue;
      }

      violations.push(relativePath);
    }

    expect(violations).toEqual([]);
  });

  it("exposes typed application events", async () => {
    const events = await import("@/core/events/app-events");

    expect(events.AppEvent.APP_OPENED).toBe("APP_OPENED");
    expect(events.AppEvent.CHIT_CREATED).toBe("CHIT_CREATED");
    expect(events.AppEvent.EXPORT_JSON).toBe("EXPORT_JSON");
  });

  it("wires application services through the container", async () => {
    const { getApplicationServices, resetApplicationServicesForTests } = await import(
      "@/core/application/application-container"
    );

    resetApplicationServicesForTests();
    const services = getApplicationServices();

    expect(services.financeRepository).toBeTruthy();
    expect(services.analytics).toBeTruthy();
    expect(services.api).toBeTruthy();
    expect(services.backup).toBeTruthy();
    expect(services.notifications).toBeTruthy();
    expect(services.configuration).toBeTruthy();
    expect(services.errorService).toBeTruthy();
  });
});
