import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppEnvironment,
  areDeveloperToolsEnabled,
  isProductionEnvironment,
  normalizeAppEnvironment,
  resolveAppEnvironment
} from "@/core/configuration/environment";

describe("application environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats explicit production APP_ENV as production", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    expect(resolveAppEnvironment()).toBe(AppEnvironment.PRODUCTION);
    expect(isProductionEnvironment()).toBe(true);
    expect(areDeveloperToolsEnabled()).toBe(false);
  });

  it("enables developer tools for QA and UAT", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "qa");
    expect(areDeveloperToolsEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "uat");
    expect(areDeveloperToolsEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "pre-production");
    expect(areDeveloperToolsEnabled()).toBe(true);
  });

  it("normalizes common aliases", () => {
    expect(normalizeAppEnvironment("dev")).toBe(AppEnvironment.DEVELOPMENT);
    expect(normalizeAppEnvironment("preprod")).toBe(AppEnvironment.PRE_PRODUCTION);
    expect(normalizeAppEnvironment("prod")).toBe(AppEnvironment.PRODUCTION);
  });
});

describe("notification test fixtures", () => {
  it("builds isolated test ids for EMI due tomorrow", async () => {
    const { buildNotificationTestFixture } = await import("@/notifications/testing/fixtures");
    const fixture = buildNotificationTestFixture("emi_due_tomorrow", "2026-07-21", "2026-07-21T12:00:00.000Z");

    expect(fixture.timeline.id.startsWith("fcc-ntest-")).toBe(true);
    expect(fixture.event.id.startsWith("fcc-ntest-")).toBe(true);
    expect(fixture.event.dueDate).toBe("2026-07-22");
  });
});
