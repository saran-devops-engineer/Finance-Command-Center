import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createConfigurationService } from "@/core/configuration/configuration-service";
import { createDefaultConfigurationProvider } from "@/core/configuration/default-configuration-provider";
import { createPostHogProvider } from "@/core/analytics/posthog-provider";
import { createAnalyticsProvider } from "@/core/analytics/analytics-provider-factory";
import { AppEvent } from "@/core/analytics/events";

const posthogMocks = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  register: vi.fn(),
  setPersonProperties: vi.fn()
}));

vi.mock("posthog-js", () => ({
  default: posthogMocks
}));

describe("PostHog analytics provider", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false })
    });
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
      platform: "Win32"
    });
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn()
    });

    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://app.posthog.com";

    posthogMocks.init.mockImplementation((_key, options) => {
      options?.loaded?.(posthogMocks);
    });
    posthogMocks.capture.mockReset();
    posthogMocks.identify.mockReset();
    posthogMocks.register.mockReset();
    posthogMocks.setPersonProperties.mockReset();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it("initializes PostHog once when analytics is enabled", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createPostHogProvider(configuration);

    await provider.initialize();
    await provider.initialize();

    expect(posthogMocks.init).toHaveBeenCalledTimes(1);
    expect(posthogMocks.identify).toHaveBeenCalled();
  });

  it("uses noop behavior from factory when analytics is disabled", () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createAnalyticsProvider(configuration);

    provider.track(AppEvent.APP_OPENED);

    expect(posthogMocks.capture).not.toHaveBeenCalled();
  });

  it("identifies users with display name only", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createPostHogProvider(configuration);

    await provider.initialize();
    provider.identify("user-123", {
      displayName: "Arjun",
      monthlyIncome: 150000
    });

    expect(posthogMocks.identify).toHaveBeenCalledWith("user-123", {
      displayName: "Arjun"
    });
  });

  it("merges automatic context properties on track", async () => {
    const configuration = createConfigurationService(createDefaultConfigurationProvider());
    const provider = createPostHogProvider(configuration);

    await provider.initialize();
    provider.track(AppEvent.HOME_LOAN_CREATED, { loan_id: "loan-1" });

    expect(posthogMocks.capture).toHaveBeenCalledWith(
      AppEvent.HOME_LOAN_CREATED,
      expect.objectContaining({
        loan_id: "loan-1",
        app_version: "0.1.0",
        platform: expect.any(String),
        browser: expect.any(String),
        operating_system: expect.any(String),
        timestamp: expect.any(String),
        analytics_provider: "posthog"
      })
    );
  });
});
